"""
Fraud Detection Module for MedTrust
Handles campaign legitimacy analysis, document verification, and pattern detection
"""

import re
import numpy as np
from datetime import datetime
import fitz  # PyMuPDF
import cv2
from PIL import Image
import io

class FraudDetector:
    """
    Multi-factor fraud detection system for medical fundraising campaigns
    """
    
    # Typical amounts for common medical conditions (in INR)
    TYPICAL_MEDICAL_COSTS = {
        'cancer': (200000, 1000000),
        'heart_disease': (150000, 800000),
        'accident': (100000, 500000),
        'emergency_surgery': (300000, 1200000),
        'organ_transplant': (1500000, 3000000),
        'burn_treatment': (300000, 1000000),
        'kidney_failure': (400000, 1200000),
        'stroke': (200000, 800000),
        'diabetes_complication': (100000, 500000),
        'default': (50000, 2000000)
    }
    
    # Red flag keywords and phrases
    RED_FLAG_KEYWORDS = {
        'urgency': r'\b(urgent|asap|immediately|quickly|emergency|critical|dying|last chance)\b',
        'pressure': r'\b(hurry|don\'t wait|limited time|act now|now or never|deadline)\b',
        'promises': r'\b(guaranteed|100% safe|ensure|promise|definitely|absolutely certain)\b',
        'cta_spam': r'\b(click here|donate now|share this|forward to friends|mass share)\b',
        'generic': r'\b(help needed|please donate|anyone can help|please help us|urgent request)\b',
    }
    
    @staticmethod
    def analyze_campaign_text(title: str, description: str, amount: float, condition: str) -> dict:
        """
        Multi-factor fraud detection for campaign text
        
        Returns:
            {
                'fraud_risk_score': 0.0-1.0,
                'flagged': boolean,
                'factors': {
                    'text_score': float,
                    'amount_score': float,
                    'length_score': float,
                    'description': string
                }
            }
        """
        factors = {}
        
        # 1. TEXT ANALYSIS (30% weight)
        text_lower = (title + ' ' + description).lower()
        red_flag_count = 0
        matched_categories = []
        
        for category, pattern in FraudDetector.RED_FLAG_KEYWORDS.items():
            if re.search(pattern, text_lower, re.IGNORECASE):
                red_flag_count += 1
                matched_categories.append(category)
        
        text_score = min((red_flag_count * 0.15), 0.5)  # Cap at 50%
        factors['text_score'] = text_score
        factors['red_flags'] = matched_categories
        
        # 2. AMOUNT OUTLIER DETECTION (35% weight)
        min_amt, max_amt = FraudDetector.TYPICAL_MEDICAL_COSTS.get(
            condition.lower(), 
            FraudDetector.TYPICAL_MEDICAL_COSTS['default']
        )
        
        amount_score = 0.0
        amount_reason = "Amount within typical range"
        
        if amount > max_amt:
            # Unusually high
            excess_ratio = (amount - max_amt) / max_amt
            amount_score = min(excess_ratio * 0.2, 0.5)
            amount_reason = f"Amount {amount:,.0f} exceeds typical max {max_amt:,.0f}"
        elif amount < min_amt:
            # Unusually low (underreporting symptoms?)
            amount_score = 0.2
            amount_reason = f"Amount {amount:,.0f} below typical minimum {min_amt:,.0f}"
        
        factors['amount_score'] = amount_score
        factors['amount_reason'] = amount_reason
        factors['typical_range'] = (min_amt, max_amt)
        
        # 3. DESCRIPTION LENGTH & DETAIL (25% weight)
        length_score = 0.0
        length_reason = "Good description length"
        
        if len(description) < 100:
            length_score = 0.3
            length_reason = "Description too brief (< 100 chars)"
        elif len(description) < 200:
            length_score = 0.15
            length_reason = "Description could be more detailed"
        else:
            # Check for detail quality
            sentence_count = len(re.split(r'[.!?]+', description))
            if sentence_count < 3:
                length_score = 0.1
                length_reason = "Too few sentences despite length"
        
        factors['length_score'] = length_score
        factors['length_reason'] = length_reason
        
        # 4. OVERALL SCORE (weighted average)
        weights = {'text_score': 0.3, 'amount_score': 0.35, 'length_score': 0.25}
        overall_score = (
            factors['text_score'] * weights['text_score'] +
            factors['amount_score'] * weights['amount_score'] +
            factors['length_score'] * weights['length_score']
        )
        
        # Normalize to 0-1
        overall_score = min(max(overall_score, 0.0), 1.0)
        
        return {
            'fraud_risk_score': round(overall_score, 3),
            'flagged': overall_score > 0.7,
            'factors': factors,
            'description': f"Text: {factors['red_flags']}, Amount: {amount_reason}, Detail: {length_reason}"
        }
    
    @staticmethod
    def verify_document(file_bytes: bytes, document_type: str = "medical_report") -> dict:
        """
        Verify authenticity of medical documents (PDF/Image)
        
        Checks for:
        - File corruption
        - Metadata tampering
        - Presence of medical keywords
        - Image manipulation (for photos)
        
        Returns:
            {
                'is_authentic': boolean,
                'confidence': 0.0-1.0,
                'warnings': [list of issues],
                'document_type_detected': string
            }
        """
        warnings = []
        authenticity = 1.0
        doc_type = "unknown"
        
        try:
            # Try to open as PDF
            file_stream = io.BytesIO(file_bytes)
            doc = fitz.open(stream=file_stream, filetype="pdf")
            doc_type = "pdf"
            
            # Extract text
            full_text = ""
            for page_num in range(len(doc)):
                page = doc[page_num]
                full_text += page.get_text()
            
            # Check content quality
            if len(full_text) < 50:
                warnings.append("Document too short - minimal content")
                authenticity -= 0.3
            
            # Check for medical keywords
            medical_keywords = ['hospital', 'clinic', 'dr.', 'doctor', 'patient', 'medical', 'treatment', 'diagnosis', 'prescription', 'medicine']
            found_keywords = sum(1 for kw in medical_keywords if kw in full_text.lower())
            
            if found_keywords == 0:
                warnings.append("Missing standard medical keywords")
                authenticity -= 0.2
            
            # Check metadata
            metadata = doc.metadata()
            if metadata:
                # Very recently modified = suspicious
                mod_date = metadata.get('modDate')
                if mod_date:
                    # Consider files modified very recently as potential fakes
                    warnings.append(f"Document recently modified: {mod_date}")
                    authenticity -= 0.1
            
            doc.close()
            
        except Exception as e:
            # If PDF fails, try image
            try:
                img = Image.open(io.BytesIO(file_bytes))
                doc_type = "image"
                
                # Basic image validation
                if img.size[0] < 100 or img.size[1] < 100:
                    warnings.append("Image resolution too low")
                    authenticity -= 0.2
                
                # Check for compression artifacts
                img_array = np.array(img)
                if len(img_array.shape) == 3:
                    # Analyze color distribution
                    unique_colors = len(np.unique(img_array.reshape(-1, img_array.shape[2]), axis=0))
                    if unique_colors < 10:
                        warnings.append("Suspiciously low color variation - possible manipulation")
                        authenticity -= 0.2
                
            except Exception as img_e:
                warnings.append("Could not read file as PDF or image")
                authenticity = 0.0
        
        authenticity = max(authenticity, 0.0)
        
        return {
            'is_authentic': authenticity > 0.6,
            'confidence': round(authenticity, 3),
            'warnings': warnings,
            'document_type': doc_type
        }
    
    @staticmethod
    def detect_duplicate_patterns(users_data: list) -> dict:
        """
        Detect suspicious account patterns (multiple accounts from same person)
        
        Args:
            users_data: List of dicts with {id, email, phone, ip_address, created_at}
        
        Returns:
            {
                'has_duplicates': boolean,
                'suspicious_clusters': [{user_ids, pattern, risk_score}],
                'total_duplicates': int
            }
        """
        suspicious_clusters = []
        
        if not users_data:
            return {
                'has_duplicates': False,
                'suspicious_clusters': [],
                'total_duplicates': 0
            }
        
        # Group by email domain
        email_domains = {}
        for user in users_data:
            email = user.get('email', '').lower()
            if '@' in email:
                domain = email.split('@')[1]
                if domain not in email_domains:
                    email_domains[domain] = []
                email_domains[domain].append(user)
        
        # Flag common email domains with multiple accounts
        for domain, users in email_domains.items():
            if len(users) > 3:  # More than 3 accounts from same email domain
                suspicious_clusters.append({
                    'pattern': f'Multiple accounts from {domain}',
                    'user_count': len(users),
                    'risk_score': min(len(users) * 0.1, 0.8),
                    'user_ids': [u.get('id') for u in users]
                })
        
        # Group by IP address
        ip_patterns = {}
        for user in users_data:
            ip = user.get('ip_address', '').lower()
            if ip:
                if ip not in ip_patterns:
                    ip_patterns[ip] = []
                ip_patterns[ip].append(user)
        
        # Flag same IP with different names (VPN/bot ring)
        for ip, users in ip_patterns.items():
            if len(users) > 2:
                suspicious_clusters.append({
                    'pattern': f'Multiple accounts from IP {ip}',
                    'user_count': len(users),
                    'risk_score': 0.9,  # High risk
                    'user_ids': [u.get('id') for u in users]
                })
        
        total_duplicates = sum(len(cluster['user_ids']) for cluster in suspicious_clusters)
        
        return {
            'has_duplicates': len(suspicious_clusters) > 0,
            'suspicious_clusters': suspicious_clusters,
            'total_duplicates': total_duplicates
        }
    
    @staticmethod
    def detect_donation_patterns(donations_data: list) -> dict:
        """
        Detect suspicious donation patterns
        
        Args:
            donations_data: List of dicts with {id, campaign_id, donor_id, amount, timestamp}
        
        Returns:
            {
                'is_suspicious': boolean,
                'anomalies': [list of detected patterns]
            }
        """
        anomalies = []
        
        if not donations_data:
            return {'is_suspicious': False, 'anomalies': []}
        
        # Analyze donation amounts for sudden spikes
        amounts = [d.get('amount', 0) for d in donations_data]
        if amounts:
            mean_amount = np.mean(amounts)
            std_amount = np.std(amounts)
            
            for donation in donations_data:
                amt = donation.get('amount', 0)
                if std_amount > 0:  # Avoid division by zero
                    z_score = abs((amt - mean_amount) / std_amount)
                    if z_score > 2.5:  # Outlier
                        anomalies.append({
                            'type': 'amount_outlier',
                            'donation_id': donation.get('id'),
                            'amount': amt,
                            'z_score': round(z_score, 2)
                        })
        
        # Detect rapid sequential donations (bot-like behavior)
        if len(donations_data) > 1:
            sorted_donations = sorted(donations_data, key=lambda x: x.get('timestamp', ''))
            
            for i in range(len(sorted_donations) - 1):
                # Check if donations within 1 minute of each other
                time_diff = (sorted_donations[i+1].get('timestamp') - sorted_donations[i].get('timestamp')).total_seconds()
                if 0 < time_diff < 60:
                    anomalies.append({
                        'type': 'rapid_sequential',
                        'donations': [
                            sorted_donations[i].get('id'),
                            sorted_donations[i+1].get('id')
                        ],
                        'time_diff_seconds': time_diff
                    })
        
        return {
            'is_suspicious': len(anomalies) > 0,
            'anomalies': anomalies
        }
