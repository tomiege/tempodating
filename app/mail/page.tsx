import { Resend } from 'resend'
import EmailForm from './email-form'

const resend = new Resend(process.env.RESEND_API_KEY)

export default function MailPage() {
  async function sendEmail(formData: FormData) {
    'use server'
    
    const email = formData.get('email') as string
    
    if (!email) {
      return { success: false, error: 'Email is required' }
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Tempo Dating <noreply@tempodating.com>',
        to: email,
        subject: 'Test Email from Tempo Dating',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ec4899;">Welcome to Tempo Dating!</h1>
            <p>This is a test email to verify that our email system is working correctly.</p>
            <p>Congrats on receiving your <strong>test email</strong>!</p>
            <div style="margin-top: 30px; padding: 20px; background-color: #fce7f3; border-radius: 8px;">
              <p style="margin: 0; color: #be185d;">If you received this email, our system is working perfectly!</p>
            </div>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Best regards,<br/>The Tempo Dating Team</p>
          </div>
        `,
      })

      if (error) {
        console.error('Resend error:', error)
        return { success: false, error: error.message }
      }

      console.log('Email sent successfully:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Failed to send email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Send Test Email</h1>
        <p className="text-center text-muted-foreground">Test the Resend email integration</p>
        <EmailForm sendEmail={sendEmail} />
      </div>
    </div>
  )
}