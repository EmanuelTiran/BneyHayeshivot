const prayerService = require('../services/prayerService');

// שליפת כל התפילות
exports.getPrayers = async (req, res) => {
    try {
        const prayers = await prayerService.getAllPrayers();
        res.json(prayers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// עדכון כל רשימת התפילות (עבור האדמין)
exports.replacePrayers = async (req, res) => {
    try {
        const { prayers } = req.body;
        if (!Array.isArray(prayers)) {
            return res.status(400).json({ message: 'prayers must be an array' });
        }
        const updated = await prayerService.replaceAllPrayers(prayers);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// יצירה (אם אתה עדיין צריך את זה בנפרד)
exports.create = async (req, res) => {
    try {
        const saved = await prayerService.create(req.body);
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};