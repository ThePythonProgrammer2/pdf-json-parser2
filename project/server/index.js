// Locate your main POST parsing route entry block inside project/server/index.js
// Replace that specific endpoint route block with this production-ready middleware integration logic:

app.post('/api/parse', (req, res, next) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bad Request: Missing text transaction payload processing context parameters.' 
      });
    }

    // Run our updated core synchronous parsing pipeline handler
    const parserResult = parseDocument(text);

    // If it's a bulk multi-resume text payload block, return the nested array collection
    if (parserResult.is_collection) {
      return res.status(200).json({
        success: true,
        count: parserResult.data.length,
        is_collection: true,
        records: parserResult.data // Always wraps collection records array list directly
      });
    }

    // Otherwise, return a unified response block matching single document expectancies safely
    return res.status(200).json({
      success: true,
      is_collection: false,
      ...parserResult.data
    });

  } catch (error) {
    console.error('API Pipeline Runtime Error Context:', error);
    next(error); // Offloads processing cleanly to yourErrorHandler middleware layout safely
  }
});
