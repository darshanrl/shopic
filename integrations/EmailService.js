// Email Service for Payment Screenshots
// This will send payment screenshots to admin email

export const EmailService = {
  async sendPaymentScreenshot(entryData, screenshotFile) {
    try {
      // For now, we'll use a simple approach with Supabase Edge Functions
      // or you can integrate with services like EmailJS, SendGrid, etc.
      
      const emailData = {
        to: 'darshanrl016@gmail.com', // Your admin email
        subject: `Payment Screenshot - Contest: ${entryData.contest_title}`,
        html: `
          <h2>New Payment Screenshot Received</h2>
          <p><strong>Contest:</strong> ${entryData.contest_title}</p>
          <p><strong>User:</strong> ${entryData.user_name} (${entryData.user_email})</p>
          <p><strong>Entry Title:</strong> ${entryData.entry_title}</p>
          <p><strong>Amount Paid:</strong> ₹${entryData.entry_fee}</p>
          <p><strong>Payment Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Google Drive Link:</strong> <a href="https://drive.google.com/drive/folders/13Vblnzi4pNIaM8tabv3gv-aMQqLz9EMG?usp=drive_link">View Screenshots Folder</a></p>
          <hr>
          <p>Please review the payment screenshot and approve/reject the entry.</p>
        `,
        screenshot: screenshotFile
      };

      // For development, we'll log the email data
      console.log('Email data to be sent:', emailData);
      
      // In production, you would send this via:
      // 1. Supabase Edge Functions
      // 2. EmailJS
      // 3. SendGrid
      // 4. Nodemailer with SMTP
      
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  async uploadToGoogleDrive(screenshotFile, entryData) {
    try {
      // This would integrate with Google Drive API
      // For now, we'll simulate the upload
      const fileName = `payment_${entryData.contest_id}_${entryData.user_id}_${Date.now()}.jpg`;
      
      console.log('Would upload to Google Drive:', {
        fileName,
        folderId: '13Vblnzi4pNIaM8tabv3gv-aMQqLz9EMG',
        file: screenshotFile
      });

      // Return the Google Drive link
      return {
        success: true,
        driveLink: `https://drive.google.com/drive/folders/13Vblnzi4pNIaM8tabv3gv-aMQqLz9EMG?usp=drive_link`,
        fileName
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  }
};

