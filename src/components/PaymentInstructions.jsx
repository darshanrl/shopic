import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function PaymentInstructions({ contestTitle, entryFee, userEmail }) {
  const [copied, setCopied] = useState(false);
  
  const adminEmail = 'darshanrl016@gmail.com';
  const driveLink = 'https://drive.google.com/drive/folders/13Vblnzi4pNIaM8tabv3gv-aMQqLz9EMG?usp=drive_link';
  
  const emailSubject = `Payment Screenshot - ${contestTitle}`;
  const emailBody = `Hi Admin,

I have made the payment of ₹${entryFee} for the contest "${contestTitle}".

Please find the payment screenshot attached.

My details:
- Name: [Your Name]
- Email: ${userEmail}
- Contest: ${contestTitle}
- Amount: ₹${entryFee}

Thank you!`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Payment Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-300 font-medium mb-2">📧 Send Payment Screenshot via Email</h4>
          <p className="text-blue-200 text-sm mb-3">
            After making the payment, send the screenshot to our admin email:
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-mono bg-slate-800 px-3 py-1 rounded">
              {adminEmail}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(adminEmail)}
              className="text-xs"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <Button
            onClick={() => window.open(`mailto:${adminEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            Open Email Client
          </Button>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <h4 className="text-green-300 font-medium mb-2">📁 Or Upload to Google Drive</h4>
          <p className="text-green-200 text-sm mb-3">
            You can also upload your payment screenshot to our Google Drive folder:
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white text-sm break-all">
              {driveLink}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(driveLink)}
              className="text-xs"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <Button
            onClick={() => window.open(driveLink, '_blank')}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Google Drive
          </Button>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <h4 className="text-yellow-300 font-medium mb-2">📋 What to Include</h4>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• Payment screenshot showing transaction details</li>
            <li>• Your name and email in the message</li>
            <li>• Contest name: "{contestTitle}"</li>
            <li>• Amount paid: ₹{entryFee}</li>
          </ul>
        </div>

        <div className="text-center text-slate-400 text-sm">
          <p>After sending the screenshot, your entry will be reviewed and approved within 24 hours.</p>
        </div>
      </CardContent>
    </Card>
  );
}

