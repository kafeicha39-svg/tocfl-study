
(function(){
  const complete = localStorage.getItem('tocfl_day1_complete') === '1';
  const status = document.getElementById('todayStatus');
  const bar = document.getElementById('homeProgress');
  const text = document.getElementById('progressText');

  if(status){
    status.textContent = complete ? '完了' : '未完了';
    status.classList.toggle('done', complete);
  }
  if(bar) bar.style.width = complete ? '100%' : '0%';
  if(text) text.textContent = complete ? 'Day 1：完了しました' : 'Day 1：未完了';
})();
