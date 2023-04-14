<script type="text/javascript" id="a11yuu_code_1">
  /* -------------------------------------------------- */
  /* Global variables  */
  var A11yuu = {};
  A11yuu.state =   {  name:    'Accessibility Code for Highly Interactive UIs',
                      author:  { name: 'auut studio', URL: 'https://findauut.com' },
                      partner: { name: 'Full Spectrum Education', URL: 'https://fullspectrum.education' },
                      license: { name: 'MIT License', URL: 'https://github.com/auutstudio/a11y-highly-interactive-UIs' },
                      DEBUG:   false,    //write to console.log; useful for understanding the focus-tracking code
                   };
  A11yuu.helper = {};
  A11yuu.webflow = {};
  A11yuu.betterbx = {};
  A11yuu.contrast = {};
  A11yuu.keyb   = {};
  A11yuu.sensed = {};
  A11yuu.sensed.mouse         = false;          //whether mouse movement has been detected
  A11yuu.sensed.mobilePortrait= false;
  A11yuu.sensed.mobileLandscp = false;
  A11yuu.DOMroot = {};
  A11yuu.DOMroot.menu =       'navbar_root';    //id of menu node as constructed by Webflow: div.w-nav[aria-label="Main menu toggle"]
  A11yuu.DOMroot.app  =       'app_root';       //id of parent node for core content of the page
  A11yuu.DOMroot.main =       'mainpage_root';  //id of parent node for section[role="main"] of the page
  A11yuu.DOMroot.lightboxes = 'lightbox_root';  //id of parent node for all Better Lightboxes on the page
  A11yuu.DOMroot.footer =     'footer_root';    //id of parent node for page footer (if any)
  A11yuu.log = {};
  A11yuu.log.focus = {};
  A11yuu.log.focus.depth =     [0];
  A11yuu.log.focus.prior =     'menu_home';      //id of the first focusable element in the DOM; perhaps a Menu button? or first <a> on the page?
  A11yuu.log.passed = {};                        //a ledger of one-time interventions in the UI
  A11yuu.log.webflow = {};
  A11yuu.tracking = {};
  A11yuu.tracking.focus = {};
  A11yuu.tracking.focus.nodes= [   // #ids of nodes for which cursor focus needs to be tracked at all times
                                   //     Do NOT include A11yuu.DOMroot.lightboxes, whose child elements are handled separately
                               '#'+A11yuu.DOMroot.menu,
                               '#'+A11yuu.DOMroot.main,
                               '#'+A11yuu.DOMroot.footer,
                               ];
  

  /* a set pause (ms) for browser rendering to finish */
  const getRenderTime  = 400;

  /* Shorthand functions to reduce the code length    */
  var getId    = function(id) { return document.getElementById( id ); };
  var getClass = function(id) { return document.getElementsByClassName( id ); };
  var getBody  = function()   { return document.getElementsByTagName('body')[0]; }

  /* Validation function */
  var existz = function(id) { 
    if (document.getElementById(id)===null) { return false; } else { return true; }
  };

  /* Commands to be run:                                */
  A11yuu.helper.BasicSensors();
  
  /* -------------------------------------------------- */


  /* General Use helper functions */

  A11yuu.helper.BasicSensors = function() {
    if (window.innerWidth < 479) { A11yuu.sensed.mobilePortrait = true; }
    if (window.innerWidth < 920 && 
        window.innerHeight < 430) { A11yuu.sensed.mobileLandscp = true; }
    getBody().addEventListener( 'mouseenter', A11yuu.helper.LogMouse );
  }
  A11yuu.helper.LogMouse = function() {
    if (!A11yuu.sensed.mouse) { A11yuu.sensed.mouse = true; }
    else { getBody().removeEventListener( 'mouseenter', A11yuu.helper.LogMouse ); }
  }
  A11yuu.helper.RemoveFromArray = function(array, n) {
     var index = array.indexOf(n);
     if (index > -1) { array.splice(index, 1); }
     return array;
  }
  A11yuu.helper.compareArrays = function(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  };
  A11yuu.helper.TriggerResize = function() {
    var ui_Event = new UIEvent('resize',{ "view":window, "bubbles":true, "cancelable":true });
    window.dispatchEvent(ui_Event);
  }

  /* Accessibility helper functions */
  A11yuu.Jot = function(id) {
    if (typeof(id)==='string') {
      A11yuu.log.focus.prior = id;
      if (A11yuu.state.DEBUG){ console.log('logged:', id); };
     } else {
      if (A11yuu.state.DEBUG){ console.log('couldnt log:', id); };
     }
  }
  A11yuu.RestoreFocus = function(id) {
    if (typeof(id)!=='string'){ id = A11yuu.log.focus.prior; }
    getId(id).focus();
    if (A11yuu.state.DEBUG){ console.log('focus set:', id); };
  }
  A11yuu.AriaPress = function(elemNode,setstate) {    // `setstate` accepts:
                                                      //      'press'   / 1
                                                      //      'unpress' / 0
                                                      //      'switch'
    if (setstate==='press'||setstate===1) {
      elemNode.setAttribute('aria-pressed','true');
    } else if (setstate==='unpress'||setstate===0) {
      elemNode.setAttribute('aria-pressed','false');
    } else if (setstate==='switch') {
      if(elemNode.getAttribute('aria-pressed')==='true') {
        elemNode.setAttribute('aria-pressed','false');
        return false;
      } else {
        elemNode.setAttribute('aria-pressed','true');
        return true;
      }
    }
  }
  A11yuu.UnderScrolling = function(newstate,idarray,policy){
    // `newstate` accepts:  true, false
    // `idarray`  (optional) array of Parent ids to constrain these actions upon; 
    // `policy`   accepts: 'strict'[default], 'lax'
    //     However, 'lax' relies on a method that allows the basepage to remain visible (although dimmed), which is not as robust for accessibility
    //     See https://alvarotrigo.com/blog/prevent-scroll-on-scrollable-element-js/
    //     TO BE IMPROVED:  see https://www.geeksforgeeks.org/how-to-disable-scrolling-temporarily-using-javascript/

    var operand, beStrict;
    if (policy!=='lax') { beStrict=true; } else { beStrict=false; }
    if (!Array.isArray(idarray)) { idarray = new Array(A11yuu.DOMroot.main); }
    if (A11yuu.state.DEBUG) { 
      console.log('Basepage scrolling:',newstate,'(policy:',beStrict,')'); 
      console.log(' affects:',idarray);
    };
    if (newstate === false) {
      for (var i=0; i<idarray.length; i++){
        operand=getId(idarray[i]);
        operand.setAttribute('aria-hidden','true');
        if (!A11yuu.sensed.mouse||beStrict) { operand.classList.add('uu-disable'); }
      }
      if (!beStrict) { rootOverflow('hidden'); }
    } else {
      for (var i=0; i<idarray.length; i++){
        operand=getId(idarray[i]);
        operand.removeAttribute('aria-hidden');
        operand.classList.remove('uu-disable');
      }
      if (!beStrict) { rootOverflow('auto'); }
    }
    function rootOverflow(value) {
      $('html').css('overflow',value);
      $('#'+A11yuu.DOMroot.app).css('overflow-y',value); 
    }
  }
  A11yuu.ScrollTo = function(id) {
    // Call this instead of .scrollIntoView() directly
    //   When a modal is visible/has focus, the basepage below it should not be navigable; this confuses a non-sighted keyboad user who (likely) can
    //   therefore move cursor focus through the basepage, defeating the modal property, and making focus-tracking incredibly more complex.

    if (!A11yuu.sensed.mobilePortrait && !A11yuu.sensed.mobileLandscp) {
      if (existz(id) && A11yuu.log.focus.depth[0]===0) {
        getId(id).scrollIntoView();
        A11yuu.Jot(id);
      }
    }
  }
  A11yuu.DisableLink = function(id) {
    // Webflow buttons are <a> tags, and at times you may need to render such a button un-clickable. 
    // While <button> tags can be disabled in HTML5, there is no equivalent for <a> tags. 
    // Derived from https://a11y-guidelines.orange.com/en/articles/disable-elements/

    if (existz(id)) {
      var operand = getId(id);
      operand.removeAttribute('href');
      operand.setAttribute('role','link');
      operand.setAttribute('aria-disabled','true');
    }
  }
</script>