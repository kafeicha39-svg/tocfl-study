(function(){
  const days = [1, 2];
  const completedDays = days.filter(day => localStorage.getItem(`tocfl_day${day}_complete`) === '1');
  const day2Complete = completedDays.includes(2);
  const todayStatus = document.getElementById('todayStatus');
  const bar = document.getElementById('homeProgress');
  const text = document.getElementById('progressText');

  if(todayStatus){
    todayStatus.textContent = day2Complete ? '完了' : '未完了';
    todayStatus.classList.toggle('done', day2Complete);
  }

  days.forEach(day => {
    const status = document.getElementById(`day${day}Status`);
    const complete = completedDays.includes(day);
    if(status){
      status.textContent = complete ? '完了' : '未完了';
      status.classList.toggle('done', complete);
    }
  });

  if(bar) bar.style.width = `${completedDays.length / days.length * 100}%`;
  if(text) text.textContent = `${completedDays.length} / ${days.length}日完了`;
})();
