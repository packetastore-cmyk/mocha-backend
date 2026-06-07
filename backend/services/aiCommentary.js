const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

class AICommentaryService {
  constructor() {
    this.model = 'claude-sonnet-4-20250514';
    this.commentaryCache = new Map();
  }

  // ===== LIVE MATCH COMMENTARY =====
  async generateLiveCommentary(matchData, event) {
    const prompt = this._buildLivePrompt(matchData, event);
    
    try {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
        system: this._getSystemPrompt()
      });

      return response.content[0].text;
    } catch (err) {
      logger.error('AI commentary error:', err);
      return this._getFallbackCommentary(event);
    }
  }

  // ===== PRE-MATCH ANALYSIS =====
  async generatePreMatchAnalysis(team1, team2, h2hData, stats) {
    const cacheKey = `prematch_${team1.id}_${team2.id}`;
    if (this.commentaryCache.has(cacheKey)) {
      return this.commentaryCache.get(cacheKey);
    }

    const prompt = `
أنت معلق رياضي مصري ظريف وذكي اسمك "موكا". 
هتكتب تحليل ما قبل مباراة بين ${team1.name} و ${team2.name}.

بيانات المواجهات السابقة:
${JSON.stringify(h2hData, null, 2)}

إحصائيات الفرق:
${JSON.stringify(stats, null, 2)}

اكتب تحليل شامل وممتع يشمل:
1. "سيرة الحرب" - تاريخ المواجهات بينهم بأسلوب ملحمي مضحك
2. "حالة الجيشين" - وضع كل فريق دلوقتي بصراحة
3. "أوراق الشاطر" - أخطر لاعب في كل فريق
4. "حكم موكا" - توقعك للمباراة بثقة (مش بتتردد)

الأسلوب: مصري ساخر راقي، مضحك بس محترم، مش إهانة لأي حد. زي صاحبك اللي بيحلل معاك المباراة على الكنبة.
الطول: 4-6 فقرات قصيرة
    `;

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      system: this._getSystemPrompt()
    });

    const result = response.content[0].text;
    this.commentaryCache.set(cacheKey, result);
    setTimeout(() => this.commentaryCache.delete(cacheKey), 24 * 60 * 60 * 1000);
    
    return result;
  }

  // ===== POST-MATCH ANALYSIS =====
  async generatePostMatchAnalysis(matchData, events, stats) {
    const prompt = `
أنت موكا، المعلق المصري الساخر.
المباراة خلصت: ${matchData.home.name} ${matchData.home.score} - ${matchData.away.score} ${matchData.away.name}

الأحداث:
${JSON.stringify(events, null, 2)}

الإحصائيات:
${JSON.stringify(stats, null, 2)}

اكتب تحليل ما بعد المباراة يشمل:
1. "الحكم الأخير" - ملخص موكا للمباراة بكل صراحة
2. "نجم الليلة" - أفضل لاعب وليه
3. "من يحاكم؟" - اللي خذل فريقه 
4. "حكمة موكا" - درس المباراة في جملة واحدة بليغة

الأسلوب: ساخر بس راقي ومحترم.
    `;

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
      system: this._getSystemPrompt()
    });

    return response.content[0].text;
  }

  // ===== PLAYER RATING COMMENTARY =====
  async generatePlayerRating(player, stats, matchContext) {
    const prompt = `
أنت موكا. قيّم أداء ${player.name} في المباراة في جملتين بالكتير.
الإحصائيات: ${JSON.stringify(stats)}
السياق: ${matchContext}
اكتب تقييم ساخر وصريح في جملتين فقط.
    `;

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
      system: this._getSystemPrompt()
    });

    return response.content[0].text;
  }

  // ===== SUBSTITUTION COMMENTARY =====
  async generateSubstitutionTake(playerOut, playerIn, matchSituation) {
    const prompt = `
في مباراة ${matchSituation}, المدرب قرر يغير ${playerOut} ويدخل ${playerIn}.
علق على القرار ده في جملة واحدة ساخرة بس محترمة. مش أكتر من 25 كلمة.
    `;

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
      system: this._getSystemPrompt()
    });

    return response.content[0].text;
  }

  // ===== TACTICAL SUGGESTION =====
  async generateTacticalSuggestion(teamName, currentStats, situation) {
    const prompt = `
أنت موكا المحلل التكتيكي. ${teamName} في ${situation}.
الإحصائيات: ${JSON.stringify(currentStats)}
اقترح تغيير تكتيكي واحد في جملة مقنعة. مش أكتر من 30 كلمة.
    `;

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
      system: this._getSystemPrompt()
    });

    return response.content[0].text;
  }

  // ===== GOAL CELEBRATION =====
  async generateGoalCelebration(scorer, assistor, minute, teamName, currentScore) {
    const prompt = `
${scorer} سجل هدف لـ${teamName} في الدقيقة ${minute}! ${assistor ? `صنعه ${assistor}.` : ''} 
النتيجة دلوقتي ${currentScore}.
اكتب تعليق احتفال عالي الطاقة في جملتين بالكتير. 
    `;

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
      system: this._getSystemPrompt()
    });

    return response.content[0].text;
  }

  // ===== SYSTEM PROMPT =====
  _getSystemPrompt() {
    return `أنت "موكا" - معلق رياضي مصري ذكي وساخر وخفيف الظل. 
شخصيتك:
- بتحلل المباريات بعمق حقيقي مش كلام فاضي
- بتستخدم تعبيرات مصرية عامية راقية (مش إهانات أو ألفاظ قبيحة)
- بتكون صريح جداً بس بطريقة ظريفة
- بتمزح بس عندك معلومة حقيقية وراء كل كلمة
- بتحب الكورة فعلاً وده بيظهر في كلامك
- مش بتحيز لفريق على حساب التاني
- بتستخدم مشبهات ذكية من الحياة اليومية المصرية
- ردودك دايماً مختصرة ومركزة وبتوصل للنقطة بسرعة
لا تستخدم: إهانات، ألفاظ قبيحة، كلام جارح فعلاً`;
  }

  _buildLivePrompt(matchData, event) {
    const { minute, type, team, player, score } = event;
    
    const eventDescriptions = {
      'Goal': `${player} سجل هدف في الدقيقة ${minute}! النتيجة ${score}`,
      'Card': `${player} أخد كارت في الدقيقة ${minute}`,
      'Substitution': `تغيير في الدقيقة ${minute}`,
      'MissedPenalty': `ضربة جزاء ضائعة في الدقيقة ${minute}!`,
      'FreeKick': `ضربة حرة خطيرة في الدقيقة ${minute}`,
      'Penalty': `ضربة جزاء في الدقيقة ${minute}!`,
      'VarDecision': `VAR قرر في الدقيقة ${minute}`,
    };

    return `
حدث في المباراة: ${eventDescriptions[type] || type}
المباراة: ${matchData.home.name} ${matchData.home.score} - ${matchData.away.score} ${matchData.away.name}
الفريق: ${team}

علق في جملتين بالكتير بأسلوب موكا الساخر.
    `;
  }

  _getFallbackCommentary(event) {
    const fallbacks = {
      'Goal': '🎯 الكورة في الشبكة! موكا يعلق لاحقاً!',
      'Card': '🟡 كارت! المدرب مش هيبقى سعيد!',
      'Substitution': '🔄 تغيير! المدرب اتحرك!',
    };
    return fallbacks[event.type] || '⚽ حدث مثير! تابع موكا!';
  }
}

module.exports = new AICommentaryService();
