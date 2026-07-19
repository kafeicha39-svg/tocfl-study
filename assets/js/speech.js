(function(){
  const synth = window.speechSynthesis;

  function waitForVoices(){
    const current = synth.getVoices();
    if(current.length) return Promise.resolve(current);

    return new Promise(resolve => {
      let finished = false;
      const finish = () => {
        if(finished) return;
        finished = true;
        synth.removeEventListener('voiceschanged', finish);
        resolve(synth.getVoices());
      };
      synth.addEventListener('voiceschanged', finish);
      window.setTimeout(finish, 1500);
    });
  }

  function chooseTaiwanVoice(voices){
    const taiwanVoices = voices.filter(voice => voice.lang.toLowerCase() === 'zh-tw');
    const preferredNames = /hsiaochen|yating|hanhan|taiwan|taiwanese|國語|台灣|臺灣/i;
    return taiwanVoices.find(voice => preferredNames.test(voice.name)) || taiwanVoices[0] || null;
  }

  async function speak(text, rate = 0.84){
    if(!synth || typeof SpeechSynthesisUtterance === 'undefined'){
      alert('このブラウザは音声再生に対応していません。');
      return false;
    }

    const voices = await waitForVoices();
    const voice = chooseTaiwanVoice(voices);
    if(!voice){
      alert('台湾華語（zh-TW）の音声が端末に見つかりません。端末の言語・読み上げ設定で「中国語（台湾）」の音声を追加してから、もう一度お試しください。');
      return false;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = 1;
    synth.speak(utterance);
    return true;
  }

  window.tocflSpeech = { speak };
})();
