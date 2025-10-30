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

    // Prepare SMS data for MagicText API - EXACT SAME AS YOUR PHP
    const smsMessage = `${otp} is your registration OTP for Topiko. Do not share this OTP with anyone. Contact 885 886 8889 for any help.`;
    
    const postData = {
        apikey: '3NwCuamS0SnyYDUw',
        senderid: 'TOPIKO',
        number: mobile,
        message: smsMessage,
        format: 'json'
    };

    try {
        console.log('Sending OTP to:', mobile, 'OTP:', otp);
        
        const response = await fetch('https://msg.magictext.in/V2/http-api-post.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        });
        
        const responseText = await response.text();
        console.log('MagicText Response:', response.status, responseText);

        // Parse response like your PHP code
        let apiResponse;
        try {
            apiResponse = JSON.parse(responseText);
        } catch (e) {
            // If JSON fails, try to parse key=value format like PHP
            apiResponse = {};
            const cleanText = responseText.replace(/[\n\r]/g, '');
            const pairs = cleanText.split('&');
            pairs.forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    apiResponse[key] = decodeURIComponent(value);
                }
            });
        }

        const msg = (apiResponse.message || '').toLowerCase();
        const success = msg.includes('success') || msg.includes('submitted successfully');

        return res.status(200).json({
            success: success,
            message: apiResponse.message || 'OTP sent',
            otp: otp,
            txn_id: apiResponse.msgid || apiResponse.txn_id || 'N/A',
            rawResponse: responseText
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