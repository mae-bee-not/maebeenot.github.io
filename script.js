document.getElementById('cat-explosion').onclick = function() {
  this.style.transform = 'translateY(10px)';
  
  var audio = document.getElementById('catBOOM');
  if (!audio.paused) {
    audio.pause();
    audio.currentTime = 0; 
  }
  audio.play().catch(e => console.error(e));
  
  setTimeout(() => {
    this.style.transform = 'translateY(0px)';
  }, 200);
};
