/**
 * Fraud Detection Controller
 * Integrates with FastAPI ML microservice for fraud analysis
 */

const axios = require('axios');
const db = require('../config/db');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const FRAUD_THRESHOLD = parseFloat(process.env.FRAUD_THRESHOLD || '0.7');

/**
 * Analyze campaign for fraud indicators
 * Calls ML service and stores fraud score in database
 */
async function analyzeCampaignForFraud(campaignId) {
  try {
    // Fetch campaign details
    const [campaigns] = await db.query(
      `SELECT 
        id, 
        title, 
        description, 
        requested_amount, 
        medical_condition 
      FROM campaigns 
      WHERE id = ?`,
      [campaignId]
    );

    if (campaigns.length === 0) {
      throw new Error('Campaign not found');
    }

    const campaign = campaigns[0];

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/analyze-campaign`,
      {
        title: campaign.title,
        description: campaign.description,
        requested_amount: campaign.requested_amount,
        medical_condition: campaign.medical_condition,
        campaign_id: campaign.id
      },
      { timeout: 30000 }
    );

    const fraudScore = mlResponse.data.fraud_risk_score;
    const flags = mlResponse.data.factors.red_flags || [];

    // Update campaign with fraud score
    await db.query(
      `UPDATE campaigns 
       SET fraud_risk_score = ?, fraud_analysis_timestamp = NOW() 
       WHERE id = ?`,
      [fraudScore, campaignId]
    );

    // Auto-flag if high risk
    if (fraudScore > FRAUD_THRESHOLD) {
      const reason = mlResponse.data.description || 'High fraud risk score detected';
      
      const [existingFlags] = await db.query(
        `SELECT id FROM fraud_flags 
         WHERE campaign_id = ? AND status IN ('PENDING', 'REVIEWING')`,
        [campaignId]
      );

      if (existingFlags.length === 0) {
        await db.query(
          `INSERT INTO fraud_flags 
           (campaign_id, reason, severity, status, created_at) 
           VALUES (?, ?, ?, 'PENDING', NOW())`,
          [campaignId, reason, 'HIGH']
        );
      }
    }

    return {
      success: true,
      campaign_id: campaignId,
      fraud_risk_score: fraudScore,
      flagged: fraudScore > FRAUD_THRESHOLD,
      factors: mlResponse.data.factors,
      message: mlResponse.data.description
    };
  } catch (error) {
    console.error('Error analyzing campaign for fraud:', error.message);
    throw new Error(`Fraud analysis failed: ${error.message}`);
  }
}

/**
 * Verify authenticity of uploaded document
 * Calls ML service to check for forgery/manipulation
 */
async function verifyDocumentAuthenticity(filePath, documentType, campaignId) {
  try {
    // Read file from disk
    const fs = require('fs').promises;
    const fileBuffer = await fs.readFile(filePath);

    // Create form data for file upload
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fileBuffer, { filename: filePath.split('/').pop() });
    form.append('document_type', documentType);
    form.append('campaign_id', campaignId);

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/verify-document`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    );

    // Store verification result
    const isAuthentic = mlResponse.data.is_authentic;
    const confidence = mlResponse.data.confidence;

    // Flag if suspected forgery
    if (!isAuthentic && confidence < 0.6) {
      const [existingFlags] = await db.query(
        `SELECT id FROM fraud_flags 
         WHERE campaign_id = ? AND reason LIKE '%document%'`,
        [campaignId]
      );

      if (existingFlags.length === 0) {
        await db.query(
          `INSERT INTO fraud_flags 
           (campaign_id, reason, severity, status) 
           VALUES (?, ?, 'MEDIUM', 'PENDING')`,
          [campaignId, `Suspicious document detected: ${mlResponse.data.warnings.join(', ')}`]
        );
      }
    }

    return {
      success: true,
      file_name: filePath.split('/').pop(),
      is_authentic: isAuthentic,
      confidence: confidence,
      warnings: mlResponse.data.warnings,
      document_type: mlResponse.data.document_type
    };
  } catch (error) {
    console.error('Error verifying document:', error.message);
    throw new Error(`Document verification failed: ${error.message}`);
  }
}

/**
 * Check for duplicate accounts/suspicious user patterns
 */
async function detectDuplicateAccounts() {
  try {
    // Fetch recent users
    const [users] = await db.query(
      `SELECT 
        id, 
        email, 
        phone, 
        ip_address, 
        created_at 
      FROM users 
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      LIMIT 100`
    );

    if (users.length === 0) {
      return { has_duplicates: false, clusters: [] };
    }

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/detect-duplicates`,
      { users },
      { timeout: 30000 }
    );

    // Flag suspicious clusters
    if (mlResponse.data.has_duplicates) {
      for (const cluster of mlResponse.data.suspicious_clusters) {
        // Log suspicious user activity
        for (const userId of cluster.user_ids) {
          await db.query(
            `INSERT INTO fraud_flags 
             (campaign_id, reason, severity, status) 
             VALUES (?, ?, 'MEDIUM', 'PENDING')`,
            [null, `User ${userId} matches duplicate pattern: ${cluster.pattern}`]
          );
        }
      }
    }

    return {
      success: true,
      has_duplicates: mlResponse.data.has_duplicates,
      clusters: mlResponse.data.suspicious_clusters,
      total_duplicates: mlResponse.data.total_duplicates
    };
  } catch (error) {
    console.error('Error detecting duplicate accounts:', error.message);
    throw new Error(`Duplicate detection failed: ${error.message}`);
  }
}

/**
 * Analyze donation patterns for anomalies
 */
async function analyzeDonationPatterns(campaignId) {
  try {
    // Fetch donations for campaign
    const [donations] = await db.query(
      `SELECT 
        id, 
        campaign_id, 
        donor_id, 
        amount, 
        created_at as timestamp 
      FROM donations 
      WHERE campaign_id = ? 
      ORDER BY created_at ASC`,
      [campaignId]
    );

    if (donations.length === 0) {
      return { is_suspicious: false, anomalies: [] };
    }

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/detect-donation-patterns`,
      { campaign_id: campaignId, donations },
      { timeout: 30000 }
    );

    // Flag if suspicious
    if (mlResponse.data.is_suspicious && mlResponse.data.anomalies.length > 0) {
      const flagReason = `Suspicious donation patterns detected: ${JSON.stringify(mlResponse.data.anomalies)}`;
      
      const [existingFlags] = await db.query(
        `SELECT id FROM fraud_flags 
         WHERE campaign_id = ? AND reason LIKE '%donation%'`,
        [campaignId]
      );

      if (existingFlags.length === 0) {
        await db.query(
          `INSERT INTO fraud_flags 
           (campaign_id, reason, severity, status) 
           VALUES (?, ?, 'MEDIUM', 'PENDING')`,
          [campaignId, flagReason]
        );
      }
    }

    return {
      success: true,
      campaign_id: campaignId,
      is_suspicious: mlResponse.data.is_suspicious,
      anomalies: mlResponse.data.anomalies,
      donation_count: donations.length
    };
  } catch (error) {
    console.error('Error analyzing donation patterns:', error.message);
    throw new Error(`Donation pattern analysis failed: ${error.message}`);
  }
}

/**
 * Batch fraud analysis (run periodically)
 */
async function batchAnalyzeAllCampaigns() {
  try {
    // Get pending/active campaigns
    const [campaigns] = await db.query(
      `SELECT id FROM campaigns 
       WHERE status IN ('PENDING', 'ACTIVE') 
       AND (fraud_analysis_timestamp IS NULL 
            OR fraud_analysis_timestamp < DATE_SUB(NOW(), INTERVAL 7 DAY))
       LIMIT 50`
    );

    const results = {
      total: campaigns.length,
      analyzed: 0,
      flagged: 0,
      errors: 0
    };

    for (const campaign of campaigns) {
      try {
        const analysis = await analyzeCampaignForFraud(campaign.id);
        results.analyzed++;
        if (analysis.flagged) results.flagged++;
      } catch (error) {
        console.error(`Error analyzing campaign ${campaign.id}:`, error.message);
        results.errors++;
      }
    }

    return results;
  } catch (error) {
    console.error('Error in batch fraud analysis:', error.message);
    throw error;
  }
}

module.exports = {
  analyzeCampaignForFraud,
  verifyDocumentAuthenticity,
  detectDuplicateAccounts,
  analyzeDonationPatterns,
  batchAnalyzeAllCampaigns
};
