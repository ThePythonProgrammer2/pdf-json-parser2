const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const NodeCache = require('node-cache');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize in-memory cache: items expire after 5 minutes (300 seconds)
const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Configure file storage limits (5MB maximum file size for server security)
const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF documents are permitted.'));
        }
    }
});

// Middleware to capture RapidAPI user identity headers
app.use((req, res, next) => {
    req.rapidApiUser = req.headers['x-rapidapi-user'] || 'anonymous_dev_user';
    next();
});

// Primary parsing endpoint
app.post('/api/v1/parse-document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Missing required file. Please upload a valid PDF under field name "document".' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error: Gemini Developer key is missing.' });
        }

        let parsedPdf;
        try {
            parsedPdf = await pdfParse(req.file.buffer);
        } catch (pdfError) {
            return res.status(422).json({ error: 'Failed to extract text data. The PDF document may be corrupted or image-only.' });
        }

        const rawText = parsedPdf.text.trim();
        if (!rawText) {
            return res.status(422).json({ error: 'The uploaded PDF does not contain extractable text characters.' });
        }

        const textHash = crypto.createHash('md5').update(rawText).digest('hex');
        const cacheKey = `${req.rapidApiUser}:${textHash}`;
        const cachedData = apiCache.get(cacheKey);

        if (cachedData) {
            res.setHeader('X-Cache-Lookup', 'HIT');
            return res.status(200).json(cachedData);
        }

        const responseSchema = {
            type: "OBJECT",
            properties: {
                document_type: { type: "STRING", description: "Must be exactly 'invoice', 'resume', or 'unknown'" },
                confidence_score: { type: "NUMBER", description: "Accuracy confidence parameter between 0.0 and 1.0" },
                primary_entity: { type: "STRING", description: "Company Name if invoice, Person Name if resume" },
                date: { type: "STRING", description: "YYYY-MM-DD or null if missing" },
                financials: {
                    type: "OBJECT",
                    properties: {
                        total_amount: { type: "NUMBER" },
                        currency: { type: "STRING" },
                        tax_amount: { type: "NUMBER" }
                    }
                },
                extracted_items: { type: "ARRAY", items: { type: "STRING" } },
                raw_summary: { type: "STRING" }
            },
            required: ["document_type", "confidence_score", "primary_entity", "date", "financials", "extracted_items", "raw_summary"]
        };

        const geminiEndpoint = `https://googleapis.com{process.env.GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{
                parts: [{
                    text: `Analyze the following raw text pulled from a PDF file. Extract and organize the attributes cleanly into the requested structured JSON template format.\n\nRaw Text:\n${rawText}`
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1
            }
        };

        const geminiResponse = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            throw new Error(`Google API processing exception: ${errText}`);
        }

        const geminiJson = await geminiResponse.json();
        const outputText = geminiJson.candidates[0].content.parts[0].text;
        const structuredResult = JSON.parse(outputText);

        apiCache.set(cacheKey, structuredResult);
        res.setHeader('X-Cache-Lookup', 'MISS');
        return res.status(200).json(structuredResult);

    } catch (globalError) {
        console.error('Server Internal Runtime Exception:', globalError.message);
        return res.status(500).json({ error: 'Internal pipeline execution fault.', message: globalError.message });
    }
});

// Centralized multer error interceptor middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File execution terminated. Upload size exceeds maximum 5MB limitation.' });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
});

app.listen(PORT, () => {
    console.log(`B2B Parser API live engine executing locally on port ${PORT}`);
});
