document.getElementById('cat-explosion').onclick = function() {
  this.style.transform = 'translateY(10px)';
  var audio = document.getElementById('catBOOM');
  audio.play();
};
