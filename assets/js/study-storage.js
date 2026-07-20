(function(){
  const weakItemsKey = 'tocfl_weak_items_v1';

  function wordId(word){
    return Array.from(String(word || '').trim())
      .map(character => character.codePointAt(0).toString(16))
      .join('-');
  }

  function normalizeEntry(entry){
    if(!entry || typeof entry !== 'object') return null;
    return {
      active: entry.active === true,
      manual: entry.manual === true,
      wrongCount: Number.isInteger(entry.wrongCount) && entry.wrongCount >= 0
        ? Math.min(entry.wrongCount, 9999)
        : 0,
      lastWrongAt: Number.isFinite(entry.lastWrongAt) ? entry.lastWrongAt : 0,
      updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0
    };
  }

  function sanitizeMap(value){
    const clean = {};
    if(!value || typeof value !== 'object' || Array.isArray(value)) return clean;
    Object.entries(value).slice(0, 500).forEach(([id, entry]) => {
      if(!/^[0-9a-f-]{1,180}$/i.test(id)) return;
      const normalized = normalizeEntry(entry);
      if(normalized) clean[id] = normalized;
    });
    return clean;
  }

  function getMap(){
    try{
      return sanitizeMap(JSON.parse(localStorage.getItem(weakItemsKey) || '{}'));
    }catch(_error){
      return {};
    }
  }

  function saveMap(map, source = 'local'){
    const clean = sanitizeMap(map);
    localStorage.setItem(weakItemsKey, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('tocfl-study-updated', {
      detail: {source, weakItems: clean}
    }));
    if(source === 'local'){
      window.dispatchEvent(new CustomEvent('tocfl-study-local-change', {
        detail: {weakItems: clean}
      }));
    }
    return clean;
  }

  function update(word, changes){
    const id = wordId(word);
    if(!id) return null;
    const map = getMap();
    const previous = normalizeEntry(map[id]) || {
      active: false,
      manual: false,
      wrongCount: 0,
      lastWrongAt: 0,
      updatedAt: 0
    };
    map[id] = normalizeEntry({
      ...previous,
      ...changes,
      updatedAt: Math.max(Date.now(), previous.updatedAt + 1)
    });
    saveMap(map);
    return map[id];
  }

  function addManual(word){
    return update(word, {active: true, manual: true});
  }

  function markWrong(word){
    const current = getMap()[wordId(word)];
    const wrongCount = Math.min((current?.wrongCount || 0) + 1, 9999);
    return update(word, {
      active: true,
      manual: current?.manual === true,
      wrongCount,
      lastWrongAt: Date.now()
    });
  }

  function resolve(word){
    return update(word, {active: false, manual: false});
  }

  function isWeak(word){
    return getMap()[wordId(word)]?.active === true;
  }

  function getEntry(word){
    return getMap()[wordId(word)] || null;
  }

  window.tocflStudyStorage = {
    key: weakItemsKey,
    wordId,
    getMap,
    replaceMap(map, source = 'cloud'){
      return saveMap(map, source);
    },
    addManual,
    markWrong,
    resolve,
    isWeak,
    getEntry
  };
})();
