$(function () {
  $('.montrose-filters').on('change', function () {
    var url = $(this).val();
    if (url) {
      window.location = url + '#search-data';
    }
    return false;
  });

 $(document).ready(function(){
      var disclaimerText = $('.hero-info .media-body');
      var disclaimerContainer = $('.media.hero-info');

      $('#newly-released-data-btn').on('click', function(){
        console.log('detected click');
        if($('#newly-released-data').hasClass('hidden')){
            $('#newly-released-data-btn').html('');
            $('#newly-released-data').removeClass('hidden');
            $('#newly-released-data-btn').html('<i class="fa fa-compress pull-right"></i>');

        }
        else{
            $('#newly-released-data-btn').html('');
            $('#newly-released-data').addClass('hidden');
            $('#newly-released-data-btn').html('<i class="fa fa-expand pull-right"></i>');
        }
      });

      // Click handler for the disclaimer icon.
      $('.hero-info > .media-left').click(function onMapDisclaimerClick(event) {
          var bodyWidth = $('body').outerWidth();
          var topPosition;

          if (disclaimerText.hasClass('hidden')) {
            topPosition = bodyWidth <= 976 ? '790px' : '295px';

            disclaimerText.removeClass('hidden');
            disclaimerContainer.css({
                'width': '300px',
                'padding': '10px',
            });
          } else {
            topPosition = bodyWidth <= 976 ? '905px' : '410px';

            disclaimerText.addClass('hidden');
            disclaimerContainer.css({
                'width': '54px',
                'padding': '2px',
            });
          }
      });

      _setActiveLanguage();
  });

});

function toggleResources(resourceId) {
  $('#' + resourceId).toggleClass('hidden');
}

/*
 * Set the active language in the language picker
 * based on the active locale
 */
function _setActiveLanguage() {
  var pathname = window.location.pathname;
  var paths = pathname.split('/');
  var languageSelector = $('.language-selector');
  var currentLanguage;
  var languageElement;

  // If there is a locale then set the active one
  if (paths.length === 5) {
    currentLanguage = paths[1];
    
    if (currentLanguage === 'en') {
      languageElement = languageSelector.find('li')[0];
    } else {
      languageElement = languageSelector.find('li')[1];
    }

    languageElement.className = 'active';
  }
}