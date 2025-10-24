export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { mobile, otp, message } = req.body;

    // Validate mobile number (10 digits)
    if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({ error: 'Invalid mobile number' });
    }

    // Prepare SMS API data - EXACT SAME FORMAT AS YOUR WORKING PHP
    const postData = {
        "apikey": "3NwCuamS0SnyYDUw",
        "senderid": "TOPIKO", 
        "number": mobile,
        "message": message,
        "format": "json"
    };
    
    // Generate exact same message format as your PHP
    const exactMessage = `${otp} is your registration OTP for Topiko. Do not share this OTP with anyone. Contact 885 886 8889 for any help.`;
    
    // Override with exact PHP message format
    postData.message = exactMessage;

    try {
        // Try multiple approaches to match your working PHP code
        let response;
        let responseText;
        
        // Try to exactly mimic your working PHP cURL implementation
        console.log('Sending to MagicText (exact PHP format):', JSON.stringify(postData));
        
        // Use exact same approach as PHP: JSON body with cURL-equivalent headers
        response = await fetch('http://msg.magictext.in/V2/http-api-post.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(postData).length.toString(),
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            body: JSON.stringify(postData),
            // Mimic cURL SSL settings
            agent: false
        });
        
        responseText = await response.text();

        console.log('Final MagicText Response Status:', response.status, response.statusText);
        console.log('Final MagicText Response Body:', responseText);

        if (response.ok) {
            // Try to parse the response to see what MagicText actually said
            let magicTextResponse = null;
            try {
                magicTextResponse = JSON.parse(responseText);
                console.log('Parsed MagicText Response:', magicTextResponse);
            } catch (parseError) {
                console.log('MagicText returned non-JSON:', responseText);
            }
            
            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                otp: otp, // Return OTP for verification
                magicTextResponse: magicTextResponse || responseText // Include actual API response
            });
        } else {
            console.error('MagicText API Error:', response.status, responseText);
            return res.status(500).json({
                error: 'Failed to send OTP',
                details: responseText
            });
        }
    } catch (error) {
        console.error('Network error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
}