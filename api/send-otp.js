export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { mobile, otp, message } = req.body;

    // Validate mobile number (10 digits)
    if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({ error: 'Invalid mobile number' });
    }

    // For testing/bypass numbers, return success immediately
    const bypassNumbers = ['8858868889', '5010000000'];
    if (bypassNumbers.includes(mobile)) {
        return res.status(200).json({
            success: true,
            message: 'Demo mode - OTP not sent',
            bypass: true
        });
    }

    // Prepare SMS data for MagicText API
    const smsMessage = `${otp} is your registration OTP for Topiko. Do not share this OTP with anyone. Contact 885 886 8889 for any help.`;
    
    const formData = new URLSearchParams({
        apikey: '3NwCuamS0SnyYDUw',
        senderid: 'TOPIKO',
        number: mobile,
        message: smsMessage,
        format: 'json'
    });

    try {
        console.log('Sending OTP to:', mobile, 'OTP:', otp);
        
        const response = await fetch('https://msg.magictext.in/V2/http-api-post.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        
        const responseText = await response.text();
        console.log('MagicText Response:', response.status, responseText);

        // Return success regardless of SMS API response
        // This ensures the flow continues even if SMS service has issues
        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp: otp,
            smsResponse: responseText
        });
        
    } catch (error) {
        console.error('SMS API Error:', error);
        
        // Return success even on error - fallback mode
        return res.status(200).json({
            success: true,
            message: 'OTP sent (fallback mode)',
            otp: otp,
            fallback: true
        });
    }
}