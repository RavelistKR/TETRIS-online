window.addEventListener('DOMContentLoaded', function () {
  setupModeButtons();
  applyShowNextUI();
  applyDeviceModeUI();

  function handleViewportChange() {
    if (App.active) {
      resizeBoards();
    }
  }

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', function () {
    setTimeout(handleViewportChange, 200);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange);
  }

  showScreen('modeScreen');
});
