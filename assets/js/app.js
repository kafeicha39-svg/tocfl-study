(function(){
  const progressStorage = window.tocflProgressStorage || localStorage;
  const lessons = window.TOCFL_COURSE?.lessons || [];

  const lessonHref = day => {
    if(day === 1) return 'lessons/day1.html';
    if(day === 2) return 'lessons/day2.html';
    if(day === 3) return 'lessons/day3.html';
    return `lessons/course.html?day=${day}`;
  };

  const completeKey = day => day <= 2
    ? `tocfl_day${day}_complete`
    : `tocfl_course_v2_day${day}_complete`;

  const completedDays = lessons
    .filter(lesson => progressStorage.getItem(completeKey(lesson.day)) === '1')
    .map(lesson => lesson.day);

  const nextLesson = lessons.find(lesson => !completedDays.includes(lesson.day)) || lessons[lessons.length - 1];
  const todayStatus = document.getElementById('todayStatus');
  const todayTitle = document.getElementById('todayTitle');
  const todayDescription = document.getElementById('todayDescription');
  const todayLink = document.getElementById('todayLink');
  const bar = document.getElementById('homeProgress');
  const text = document.getElementById('progressText');

  if(todayTitle) todayTitle.textContent = `Day ${nextLesson.day}・${nextLesson.theme}`;
  if(todayDescription){
    todayDescription.textContent = `${nextLesson.words.map(item => item.w).join('・')}を、音声とクイズで学びます。`;
  }
  if(todayLink){
    todayLink.href = lessonHref(nextLesson.day);
    todayLink.textContent = `Day ${nextLesson.day}を始める`;
  }
  if(todayStatus){
    const allComplete = completedDays.length === lessons.length;
    todayStatus.textContent = allComplete ? '全日程完了' : '未完了';
    todayStatus.classList.toggle('done', allComplete);
  }

  [1, 2].forEach(day => {
    const status = document.getElementById(`day${day}Status`);
    const complete = completedDays.includes(day);
    if(status){
      status.textContent = complete ? '完了' : '未完了';
      status.classList.toggle('done', complete);
    }
  });

  const unitInfo = {
    1: {title: 'Unit 1・生活と社会', range: 'Day 3〜12', source: 'tocfl 1-1'},
    2: {title: 'Unit 2・仕事、旅、芸術', range: 'Day 13〜31', source: 'tocfl 1-2'}
  };
  const container = document.getElementById('courseUnits');
  if(container){
    container.innerHTML = [1, 2].map(unit => {
      const unitLessons = lessons.filter(lesson => lesson.unit === unit && lesson.day >= 3);
      const shouldOpen = unitLessons.some(lesson => lesson.day === nextLesson.day);
      return `
        <details class="course-unit" ${shouldOpen ? 'open' : ''}>
          <summary>
            <span><strong>${unitInfo[unit].title}</strong><br><span class="muted">${unitInfo[unit].range}・${unitInfo[unit].source}</span></span>
            <span class="unit-count">${unitLessons.length}日分</span>
          </summary>
          <div class="grid lesson-grid course-grid">
            ${unitLessons.map(lesson => {
              const complete = completedDays.includes(lesson.day);
              return `
                <article class="mini-card">
                  <span class="eyebrow">DAY ${lesson.day}</span>
                  <h3>${lesson.theme}</h3>
                  <p>${lesson.words.map(item => item.w).join('・')}</p>
                  <a class="text-link" href="${lessonHref(lesson.day)}">学習する →</a>
                  <span class="status lesson-status ${complete ? 'done' : ''}">${complete ? '完了' : '未完了'}</span>
                </article>`;
            }).join('')}
          </div>
        </details>`;
    }).join('');
  }

  if(bar) bar.style.width = `${completedDays.length / lessons.length * 100}%`;
  if(text) text.textContent = `${completedDays.length} / ${lessons.length}日完了`;

  window.addEventListener('tocfl-progress-updated', () => location.reload());
})();
