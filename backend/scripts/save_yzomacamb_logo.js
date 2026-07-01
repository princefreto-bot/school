const fs = require('fs');
const path = require('path');
const { supabase } = require('../utils/supabase');

async function run() {
    console.log('🔍 [YZOMACAMB Logo] Querying app_settings_csyzomacamb...');
    try {
        const { data, error } = await supabase
            .from('app_settings_csyzomacamb')
            .select('school_logo')
            .eq('id', 'global_settings')
            .single();

        if (error) {
            console.error('❌ Error fetching YZOMACAMB logo:', error.message);
            return;
        }

        if (!data || !data.school_logo) {
            console.log('⚠️ The school_logo is null or empty.');
            return;
        }

        let imageBuffer;
        let ext = 'png';

        if (data.school_logo.startsWith('data:image/')) {
            const matches = data.school_logo.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!matches) {
                console.error('❌ Invalid base64 format.');
                return;
            }
            ext = matches[1];
            const base64Data = matches[2];
            imageBuffer = Buffer.from(base64Data, 'base64');
            console.log(`✅ Base64 logo decoded (${imageBuffer.length} bytes).`);
        } else {
            console.log('Logo is stored as URL, fetching image from:', data.school_logo);
            const fetch = require('node-fetch');
            const res = await fetch(data.school_logo);
            imageBuffer = await res.buffer();
            console.log(`✅ Logo fetched from URL (${imageBuffer.length} bytes).`);
        }

        const outputPath = path.join(__dirname, '../../yzomacamb_logo.' + ext);
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`🎉 Logo saved successfully to: ${outputPath}`);
    } catch (err) {
        console.error('💥 Exception:', err.message);
    }
}

run();
