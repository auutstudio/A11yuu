 /* A11yuu: Accessibility assists for highly interactive UIs
  * Version: 0.9
  * Copyright © 2023-2025 auut studio, findauut.com <info@findauut.com>

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  *
  */


/* -------------------------------------------------- */
/* High Priority variables                            */

window.Ayuu || ( window.Ayuu = {} );
Ayuu.version   = "0.9";
Ayuu.mode      = "";              // use "production" to trap all errors.
Ayuu.mobileWH  = [479, 939, 840]; // the maximum [W,H] (in px) that you assume to be a mobile screen.
Ayuu.renderMs  = 400;             // ms to wait, for times when browser rendering needs to catch up.


/* -------------------------------------------------- */
/* Some shorthand functions                           */

const uuMs     = Ayuu.renderMs; // default: 400ms
const uuSlow   = 2.25 * Ayuu.renderMs;   // 900ms
const uuFast   = 0.75 * Ayuu.renderMs;   // 300ms
const uuVF     = 0.5  * Ayuu.renderMs;   // 200ms
const uuXVF    = 0.25 * Ayuu.renderMs;   // 100ms

const getBody  = function() { 
  return document.getElementsByTagName("body")[0]; 
};
const getClass = function(classname) { 
  return document.getElementsByClassName(classname); 
};
const getId = function(id) { 
  try {
    let thatElem = document.getElementById(id);
    return thatElem;
  } catch (e) {
    if (e instanceof TypeError) {
      throw new ErrorUnknownId( "acted on ‘" + id + "‘" );
    }
    return false;
  }
};
const actUpon  = function(obj) {
  // given a string id, or jQuery object, or node, this will always send back
  //   the relevant `document.ElementNode` (a native DOM object)
  //   Or returns `false` if the passed string does not exist as an id in the DOM.

  let id, s;
  if (typeof jQuery!=='undefined' && obj instanceof jQuery) {
    return obj.get(0);
  } else if (typeof(obj)==="object") {
    return obj;
  } else if (typeof(obj)==="string") {
    s = obj.slice(0,1);
    if (s==="#") { id=obj.slice(1); } else { id=obj; }
    if (document.getElementById(id)===null) {
      if (Ayuu.DEBUG){
        console.log( "WARNING: Requested to actUpon ‘"+id+"’, but it doesn’t exist." );
      }
      return false;
    } else {
      return document.getElementById(id);
    }
  }
};
const parseAs = function(form, label) {
  // Converts `label` into the desired syntax
  // `form` accepts:  '.'  → ensures the output is  .label
  //                  '#'  → ensures the output is  #label
  //                  '§'  → ensures the output is  label

  let s, f = String(form).toLowerCase();
  switch(f) {
    case ".":
    case "#":
      if (String(label).split(f).length>1) {
        return label;
      } else {
        return f+label;
      }
      break;
    case "§":
      s = String(label).slice(0,1);
      if (s==="."||s==="#") { 
        return label.slice(1); 
      } else if (String(label).split(/[#\.]/).length>1) {
        return String(label).split(/[#\.]/)[1];
      }
      break;
    default:
  }
  return label;
};
const whenReady = function(fn) {
  if (document.readyState!=="loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
};


/* -------------------------------------------------- */
/* Namespace variables                                */

Ayuu.DEBUG         = false;   // dont log to console unless & until a11yuu-debug.js is loaded
Ayuu.meta          = {};
Ayuu.meta.name     = "A11yuu(p)! Accessibility assists for highly interactive UIs";
Ayuu.meta.author   = { "name": "auut studio", 
                       "url":  "https://findauut.com"  };
Ayuu.meta.partner  = { "name": "Full Spectrum Education", 
                       "url":  "https://fullspectrum.education" };
Ayuu.meta.license  = { "name": "MIT License", 
                       "url":  "https://github.com/auutstudio/a11yuu" };
Ayuu.Helper        = {};
Ayuu.DOM           = {};
Ayuu.media         = {};
Ayuu.bbox          = {};
Ayuu.bbox.dimens   = {};
Ayuu.wf            = {};
Ayuu.sensed        = {};
Ayuu.log           = {};
Ayuu.focus         = {};
Ayuu.TogTips       = {};
Ayuu.contrast      = {};
Ayuu.fxCC          = {};
Ayuu.kbshort       = {};
Ayuu.setTrigger    = {};
Ayuu.Extend        = {};
Ayuu.strings       = {};
Ayuu.strings.en    = {};
//Ayuu.strings.es  = {};
//Ayuu.strings.fr  = {};


/**    WEBFLOW-SPECIFIC implementation:   **/

Ayuu.wf.lightbox = {   // DOM naming pattern used natively by Webflow
  "trigger":  "a.w-lightbox",
  "script":   "script.w-json",
  "pane": { 
              "class": "div.w-lightbox-view", 
              "id":    "w-lightbox-view" 
          },
  "close":    "div.w-lightbox-close",
  "img":      "img.w-lightbox-img" 
  };
Ayuu.wf.triggers = []; // This array will itemize all Webflow-native lightboxes on the page.
  // TO USE: set an attribute `uu-alt-text` on each `a.w-lightbox` (link element that Webflow creates)
  // A11yuu will use that string as the missing Alt text of the enlarged/lightboxed image. E.g.:
  //
  //   <a class="w-lightbox" id="btn_for_lightbox_1" href="#" uu-alt-text="Closeup of a green turtle.">
  //
  //
  // NOTE: at runtime, an entry in this array will also be an array, looking something like this:
  //   ["btn_for_lightbox_1", "thumbnail", "Closeup of a green turtle."]

Ayuu.strings.en.describeLbox = "A dialog box fills the screen, dimming the content below. It shows the image at a larger size.";
Ayuu.strings.en.altFallback  = "Apologies. This image is missing its Alt Text.";

Ayuu.wf.tablink = {   // needed if you utilize Webflow’s tabs affordance inside your Better Boxes dialogs.
  "parent": ".w-tab-menu",
  "class":  "a.w-tab-link",
  "suffix": "_tab",
  "labels": ".uu-tab{%1}-titles",
  "title":  ".uu-tab-innertext"
  };


/**     “BETTER BOXES”     **/

  // A11yuu suggests using its HTML structure and naming pattern for your
  //  modal dialog boxes. If built in this predictable structure, then A11yuu
  //  can take care of making it well-behaved for accessibility. (Launching it, 
  //  dimming the screen, trapping focus, announcing its heading, suppressing the
  //  baselayer, closing with Esc, restoring the cursor to its prior location.)

  // Alter the following values to reflect your preferred naming pattern for dialog boxes.
  
Ayuu.bbox.naming = {
  "base":    "dialog_{%1}",
    //  Use underscores as you please, but your `base` must end with placeholder {%1}
    //  This represents the pattern by which you will serialize ids, eg:
    //  dialog_1  dialog_2  dialog_3
  "heading": "_handle",    // eg. dialog_1_handle
  "narrate": "_voiced"     // eg. dialog_1_voiced
  };
Ayuu.bbox.class = {
  "main":   "uu-dialog-box",
  "reveal": "uu-full-opacity",
  "close":  "uu-close-btn-corner"
  };
function bboxNamed(x) {
  // Shorthand: use a single digit to refer to a Better Box parent id
  return String(Ayuu.bbox.naming.base).split("{%1}")[0] + String(x);
};


/**    EXPECTED DOM NAMING PATTERNS     **/

Ayuu.DOM.scaffolds         = "uu-hierarchy uu-white-text";
Ayuu.DOM.nonvisible        = "uu-visib-hidden";       // classname that sets visibility: hidden
Ayuu.DOM.displayNone       = "uu-dont-show";          // classname that sets display: none
Ayuu.DOM.grow              = "uu-grow";               // classname to render a transcript area larger/more prominent
Ayuu.DOM.unexpand          = "uu-collapse";           // classname to render expandable things in their closed state,
                                                         //   It will be applied alongside `aria-expanded=false`
Ayuu.DOM.lightboxTrigger   = Ayuu.wf.lightbox.trigger;
Ayuu.DOM.lightboxTriggerJs = Ayuu.wf.lightbox.script;
Ayuu.DOM.lightboxPane      = Ayuu.wf.lightbox.pane;
Ayuu.DOM.lightboxCloseBtn  = Ayuu.wf.lightbox.close;
Ayuu.DOM.lightboxImg       = Ayuu.wf.lightbox.img;
Ayuu.DOM.rootApp           = "root_app";     // id of parent node for core content of the page
Ayuu.DOM.main              = "root_main";    // id of node which is <main> or `[role="main"]`
Ayuu.DOM.rootBBoxes        = "root_modals";  // id of parent for all Better Boxes on the page
Ayuu.DOM.rootFooter        = "root_footer";  // id of parent node for the footer (if any)
Ayuu.DOM.menuToggle        = "root_nav_btn"; // id for the container around the Main Menu button
                                                //  NOTE: in Webflow, this node is constructed something like
                                                // `div.w-nav[aria-label="Main menu toggle"]`
Ayuu.media.videoWrapper    = "able-wrapper"; // classname of the particular div holding a <video> tag,
                                                // whose W x H can be resized to change the size of the video itself
  // if using Able Player:
Ayuu.media.playBtn         = "div.able-button-handler-play";
Ayuu.media.pauseBtn        = "div.able-button-handler-play[aria-label='Pause']";
  // if using playerJS:
//Ayuu.media.playBtn       = "div.plyr__controls__item.plyr__control[data-plyr='play']";
//Ayuu.media.pauseBtn      = "div.plyr__controls__item.plyr__control[aria-label='Pause']";


/**   MAIN CONTROL BUTTONS   **/
/**    (a set of tools - often placed inside the Main Menu)  **/

Ayuu.fxCC.modeON           =   "uu-captioned";              // classname on <body> to display SFX captions (via CSS rules)
Ayuu.fxCC.triggerIO        =   "btn_captions";              // a single id of the button that turns Sound Captions ON/off
Ayuu.fxCC.audioPlayer      =   "uu-sfx-player";             // classname of the <audio> element producing a sound to be captioned
Ayuu.fxCC.container        =   "uu-caption-container";      // classname holding the visual captions
Ayuu.fxCC.inlineBtns       =   "uu-caption-btn-hide";       // classname for the button to dismiss soundFX captions
Ayuu.TogTips.modeON;      // (no class is utilized here)
Ayuu.TogTips.modeOFF       =   "uu-hidevocab";              // classname on <body> to suppress all toggle tip trigger buttons
Ayuu.TogTips.triggerIO     =   "btn_vocab_mode";            // a single id of the button that allows/disallows Toggletips
Ayuu.TogTips.kwClass       =   "uu-terms";
Ayuu.TogTips.btnClass      =   "uu-define-me";
Ayuu.TogTips.containerClass=   "uu-definition";
Ayuu.TogTips.containerLabel=   "uu-definition-handle";
Ayuu.contrast.modeON       =   "uu-contrast";               // classname on <body> to render hi-Contrast CSS styling
Ayuu.contrast.triggersIO   = [ "btn_contrast_mode" ];       // Array:  id(s) of all buttons that toggle Hi-Contrast mode ON/off
Ayuu.kbshort.modeON        =   "uu-kbshorts";               // classname on <body> for visual changes when shortcuts are ON
Ayuu.kbshort.modeOFF       =   "uu-default";                // classname on <body> when shortcuts are OFF
Ayuu.kbshort.triggers      = {                              // Object w/ Arrays: id(s) of all buttons that will turn ON Keyboard Shortcuts
              "direct":      [ "btn_clickme_to_activate" ], 
              "passive":     [ "btn_use_kbshortcuts"     ],};
Ayuu.kbshort.btnWrapper    =   "assist_kb_button_wrapper";  // id of the div holding the primary/most prominent button for activating Keyboard Shortcuts
Ayuu.kbshort.legendWrapper =   "assist_kb_instructions";    // id of the div holding an on-screen legend to the (now-activated) shortcuts, which a screenreader will announce.
Ayuu.kbshort.legendClass   =   "uu-assist-section";         // class name for any other divs that explain uses of the (now-activated) shortcuts, which a screenreader will announce.


/**   LOGGING    **/

Ayuu.sensed.mouse          = false;   // whether mouse movement has been detected since the page loaded
Ayuu.sensed.Portrait       = false;   // does the window size (at moment of test) imply a mobile device?
Ayuu.sensed.PortraitTall   = false;   // does window size (at moment of test) imply a very tall mobile screen?
Ayuu.sensed.Landscape      = false;   // does window size (at moment of test) imply being rotated to landscape?
Ayuu.log.lightbox          = [];      // will track which native-Webflow lightboxes have been launched & rectified in realtime.
Ayuu.log.kbshort           = {};
Ayuu.log.kbshort.enabled   = false;
Ayuu.log.kbshort.revealed  = false;


/**    INITIAL STATES     **/

Ayuu.focus.prior   = "menu_home";         // id of the first focusable element on this page
Ayuu.focus.suspend = false;               // Toggletips have the ability to pause normal focus-tracking
Ayuu.focus.nodes   = [ parseAs('§', Ayuu.DOM.menuToggle),
                       parseAs('§', Ayuu.DOM.main),
                       parseAs('§', Ayuu.DOM.rootFooter) ];
  // NOTE: `.nodes` is an array of ids (as strings) of the parent node to each major section of the page.
  //   Only within these sections will A11yuu constantly monitor the cursor focus.

Ayuu.focus.depth   = [ 0, "", "", [0,0] ];
  // (Could be extrapolated to handle additional layers of interface.)
  // At runtime, this might look something like:   [ 1, "dialog_3", "term", [1,0] ]
  //
  //  depth[0]  is where on the z-axis the user is currently interacting, relative to:
  //                   0 = basepage,
  //                   1 = in a native lightbox, Better Box, or in a visible Toggletip
  //                   2 = in a modal or Toggletip rendered atop layer 1.
  //  depth[1]:  id of the parent div for the current layer shown at depth 1 that has focus.
  //  depth[2]:  id (or custom shorthand) for the current layer at depth 2 which is superimposed over depth 1 that has focus.
  //  depth[3]:  the granular position inside a visible Toggletip, stored as an array: 
  //                   [ Has focus entered the container? , Has focus moved beyond the container? ]

Object.defineProperties(Ayuu, {   // Getter, setter functions
  atDepth:      { get()  { return this.focus.depth[0]; },      },
  setDepth:     { set(x) { this.focus.depth[0] = x; },         },
  clrDepth:     { set(x) { this.focus.depth=[0,"","",[0,0]]; },},  //input (x) is ignored
  ttipReset:    { set(x) { this.focus.depth[3] = [0,0];            //input (x) is ignored
                           if(Ayuu.DEBUG){Ayuu.Cs(300)} },     },
  ttipEntered:  { set(x) { this.focus.depth[3][0] = 1; },      },  //input (x) is ignored
  ttipTraverse: { set(x) { this.focus.depth[3][1] = x; },      },
  
});


/* -------------------------------------------------- */
/* General Error Handling                             */

class ErrorUnknownId extends Error {
  constructor(message) { super(message); this.name = "ErrorUnknownId"; }
  customMessage() { return `The code sought an element that doesn’t exist on the page: 
  ${this.message}`; }
}
if (Ayuu.mode==="production") {
  window.onerror = function(message, url, lineNo, colNo, error) {
    console.log(" ");
    if (error instanceof ErrorUnknownId) {
      console.log(`${error.name} at line ${lineNo} : ${colNo} of ${url}`);
      console.log(`${error.customMessage()}`);
    } else {
      console.log(`${error} at line ${lineNo} : ${colNo} of ${url}`);
      console.log(" ",`${message}`); 
    }
    return true;
  };
}
window.onunhandledrejection = event => {
  console.warn(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
};


/* -------------------------------------------------- */
/* Helper Functions:                                  */

Ayuu.Helper.Sensors = function() {
  let domBody = getBody();
  if (window.innerWidth <= Ayuu.mobileWH[0]) { 
    Ayuu.sensed.Portrait = true; 
    if (window.innerHeight >= Ayuu.mobileWH[2]) {
      Ayuu.sensed.PortraitTall = true; 
    }
  }
  if ( window.innerWidth  <= Ayuu.mobileWH[1] 
    && window.innerHeight <= Ayuu.mobileWH[0] ) { 
    Ayuu.sensed.Landscape = true;
  }
  domBody.addEventListener( "mouseenter", Ayuu.Helper.LogMouse );
};

Ayuu.Helper.LogMouse = function() {
  if (!Ayuu.sensed.mouse) { Ayuu.sensed.mouse = true; }
  else { 
    let domBody = getBody();
    domBody.removeEventListener( "mouseenter", Ayuu.Helper.LogMouse ); 
  }
  if (Ayuu.DEBUG){ console.log('mouse detected'); }
};

Ayuu.Helper.RemoveFromArray = function(array, n) {
   let index = array.indexOf(n);
   if (index > -1) { array.splice(index, 1); }
   return array;
};

Ayuu.Helper.CompareArrays = function(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
};

Ayuu.Helper.ExpectedSiblingByClass = function(el, classname) {
  if (typeof(classname)!=="string" || classname==="") { return false; }

  // Checks the immediately previous sibling to see if has `classname`.
  //   If not, then does a second check among that sibling's children.
  //   Returns an array with [ElementNode, id] of the first node found which does have `classname`.
  //   Otherwise, returns `false`.

  let origin = actUpon(el),
      priorSib = origin.previousElementSibling,
      sibId;

  if (!priorSib.classList.contains(classname)) {
    priorSib = priorSib.querySelector(":scope ."+classname);
    if (priorSib!==null) {
      sibId = priorSib.getAttribute("id");
      return [priorSib, sibId];
    } else {
      return false;
    }
  } else {
    sibId = priorSib.getAttribute("id");
    return [priorSib, sibId];
  }
}

Ayuu.Helper.TriggerResize = function() {
  let uuUiEvent = new UIEvent("resize",{ "view":window, "bubbles":true, "cancelable":true });
  window.dispatchEvent(uuUiEvent);
};

Ayuu.Helper.SimulateClick = function(obj) {
  let uuUiEvent = document.createEvent("MouseEvents");
  uuUiEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  if (obj instanceof jQuery) {
    obj.get(0).dispatchEvent(uuUiEvent);
  } else if (typeof(obj)==='object') {
    obj.dispatchEvent(uuUiEvent);
  }
};

Ayuu.Helper.PauseAllMedia = function(el) {  //expected: STRING
  // Stop any playing media Players inside the parent `el` 
  // or, acts upon the whole DOM if no valid parent is specifed.
  let aimed, aimLength;
  
  if (typeof(el)!=="string") {
    aimed = document.querySelectorAll(Ayuu.media.pauseBtn);
  } else {
    try {
      aimed = actUpon(el).querySelectorAll(Ayuu.media.pauseBtn);
    } catch (e) {
      aimed = document.querySelectorAll(Ayuu.media.pauseBtn);
    }
  }
  aimLength = aimed.length;
  for (let i=0; i<aimLength; i++) {
    $(aimed[i])[0].click();
  }
};

Ayuu.Helper.PauseIframeMedia = function(frameId) {
  // Seeks to hit the Pause button inside the DOM of a named iframe, so long as
  //   the iframe source is on the same domain (due to CORS policies).
  let aimed, aimLength;

  if (typeof(frameId)==="string") {
    try {
      aimed = actUpon(frameId).contentWindow.document.querySelectorAll(Ayuu.media.pauseBtn);
    } catch (e) {
      return false;
    }
  }
  aimLength = aimed.length;
  for (let i=0; i<aimLength; i++) {
    $(aimed[i])[0].click();
  }
};

Ayuu.Helper.InterceptEsc = function(event) {
  // Called on every `keypress` event from an open dialog/popup/Toggletip. This tests whether
  //   the pressed key was the Esc key. If it was, WCAG guidelines expect that the open
  //   popup layer should now close.

  //   The actions to take at this point will be handled by your customization of the function
  //     my_actions_when_the_Esc_key_requests_closure().
  //   What you want it to do will be particular to each dialog/Toggletip. But in the absence
  //   of any customization, you probably will want to let it run its default command:
  //      Ayuu.bbox.Unmount( `id_of_the_dialog_that_is_open` );
  //
  //   Your needs might also depend on @ which depth the user is (at the moment of pressing Esc).
  //   All this info is passed to your custom function using Ayuu.focus.depth.
  
  if (event.code=="Escape") {
    my_actions_when_the_Esc_key_requests_closure(Ayuu.focus.depth[0], Ayuu.focus.depth[1], Ayuu.focus.depth[2]);
  }
};

/* ------------------------------------ */
/* Public Functions:                    */

Ayuu.Grow = function(el, action) {
  // Or: set `action` as "reverse" to shrink the element instead.
  if (action === "reverse") { 
    actUpon(el).classList.remove(Ayuu.DOM.grow);
  } else {
    actUpon(el).classList.add(Ayuu.DOM.grow);
  }
};

Ayuu.HideMe = function(el, action) {
  // Hides the target element `el`.
  // Or: set `action` as "unhide" to unhide it instead.
  let operand = actUpon(el);

  if (action==="unhide") {

    // Unhide steps: 
    operand.classList.remove(Ayuu.DOM.displayNone);
    operand.removeAttribute("aria-hidden");
    if (operand.classList.contains(Ayuu.bbox.class.main)) {
      // Better Boxes require an add’l class for full opacity:
      let delayFadeIn = setTimeout(function() { 
        operand.classList.add(Ayuu.bbox.class.reveal); 
      }, uuVF);
    }
  } else { 

    // Do the hiding:
    if (operand.classList.contains(Ayuu.bbox.class.main)) {
      // for Better Boxes, opacity animates to 0.1 before hiding:
      operand.classList.remove(Ayuu.bbox.class.reveal);
      let delayHideMe = setTimeout(function() { 
        operand.classList.add(Ayuu.DOM.displayNone); 
      }, uuMs);
    } else {
      operand.classList.add(Ayuu.DOM.displayNone);
    }
    operand.setAttribute("aria-hidden","true");
  }
};

// Shorthand to refer to the formal HideMe function.
//  (You could instead redirect these to a custom function if you wanted to.)
Ayuu.Hide   = function(el){ Ayuu.HideMe(el); };
Ayuu.Unhide = function(el){ Ayuu.HideMe(el,"unhide"); };


Ayuu.RestoreFocus = function(id) {
  if (id===null){ id = Ayuu.focus.prior; }
  if (Ayuu.DEBUG){ Ayuu.Cs(50,[id]) };
  try {
    actUpon(id).focus();
  } catch (e) {
    actUpon(Ayuu.focus.prior).focus();
  }
};

Ayuu.AriaPress = function(el, setstate) {
  // `setstate` accepts:  "press"   (or: 1)
  //                      "unpress" (or: 0)
  //                      "switch"

  let operand = actUpon(el);
  if (operand) {
    if (setstate==="press"||setstate===1) {
      operand.setAttribute("aria-pressed","true");
    } else if (setstate==="unpress"||setstate===0) {
      operand.setAttribute("aria-pressed","false");
    } else if (setstate==="switch") {
      if(operand.getAttribute("aria-pressed")==="true") {
        operand.setAttribute("aria-pressed","false");
        return false;
      } else {
        operand.setAttribute("aria-pressed","true");
        return true;
      }
    }
  } 
};

Ayuu.AriaExpand = function(el, setstate) {
  // `el` should refer to an element having both an `aria-expanded` attribute
  //     along with `aria-owns` (or `aria-controls`) to identify its expandable target.
  //
  // `setstate` accepts:  "expand"   (or: 1) 
  //                      "collapse" (or: 0) 
  //                      "switch"
  //                      "query"

  let operand = actUpon(el),
      opState, opControls, opOwns, opTarget,
      customClassed = false;

  if (operand) { 
    opState    = operand.getAttribute("aria-expanded");
    opControls = operand.getAttribute("aria-controls");
    opOwns     = operand.getAttribute("aria-owns");
    if (Ayuu.DOM.unexpand) { customClassed = true; }
  

    if (setstate==="query" && opState==="false") {
      return false;
    } else if (setstate==="query" && opState==="true") {
      return true;
    }

    if (typeof(opControls)==="string") {
      opTarget = opControls;          // will be a (string) id
    } else if (typeof(opOwns)==="string") {
      opTarget = opOwns;              // will be a (string) id
    } else {
      opTarget = operand;
    }
    if (typeof(opTarget)==="string") {
      opTarget = actUpon(opTarget);
      if (!opTarget) {
        opTarget = operand;
      }
    }

    if (setstate==="expand"||setstate===1) {
      operand.setAttribute("aria-expanded","true");
      if (customClassed) { opTarget.classList.remove(Ayuu.DOM.unexpand); }

    } else if (setstate==="collapse"||setstate===0) {
      operand.setAttribute("aria-expanded","false");
      if (customClassed) { opTarget.classList.add(Ayuu.DOM.unexpand); }

    } else if (setstate==="switch") {
      if(opState==="true") {
        operand.setAttribute("aria-expanded","false");
        if (customClassed) { opTarget.classList.add(Ayuu.DOM.unexpand); }
        return false;

      } else {
        operand.setAttribute("aria-expanded","true");
        if (customClassed) { opTarget.classList.remove(Ayuu.DOM.unexpand); }
        return true;
      }
    }

  }
};

Ayuu.UnderScrolling = function(newstate, arrIds, policy) {
  // `newstate` accepts:  true, false
  // `arrIds` (optional): an array of parent ids to constrain its actions upon
  // `policy` accepts:    "strict" [default], "lax"
  //
  // When a modal is visible/has focus, the basepage below shouldn’t be navigable, as this confuses 
  //   a non-sighted keyboad user who (likely) can therefore continue tabbing the cursor back down 
  //   through focusable elements on the basepage. Such a situation defeats the “modal” nature of the
  //   dialog, and fails to meet the success criteria of WCAG guidelines.
  //
  //   NOTE: a "lax" policy relies on a method that leaves the basepage visible (although dimmed), which 
  //   is not as robust for preventing keyboard navigation from wandering off-track. A compromise solution
  //   would be to call for the lax policy only `if (Ayuu.sensed.mouse)`.
  //   See https://alvarotrigo.com/blog/prevent-scroll-on-scrollable-element-js/
  //   TO BE IMPROVED: https://www.geeksforgeeks.org/how-to-disable-scrolling-temporarily-using-javascript/
  //

  let arrLength = arrIds.length,
      operand, beStrict;

  if (policy!=="lax") { beStrict=true; } else { beStrict=false; }

  // fallback measure if the second parameter is invalid
  if (!Array.isArray(arrIds)) { arrIds = new Array(Ayuu.DOM.main); }
  if (Ayuu.DEBUG){ Ayuu.Cs(100,[newstate,beStrict,arrIds]) }

  if (newstate===false) {
    for (let i=0; i<arrLength; i++){
      operand = getId(arrIds[i]);
      operand.setAttribute("aria-hidden","true");
      if (!Ayuu.sensed.mouse||beStrict) { operand.classList.add(Ayuu.DOM.nonvisible); }
    }
    if (!beStrict) { rootOverflow("hidden"); }
  } else {
    for (let i=0; i<arrLength; i++){
      operand = getId(arrIds[i]);
      operand.removeAttribute("aria-hidden");
      operand.classList.remove(Ayuu.DOM.nonvisible);
    }
    if (!beStrict) { rootOverflow("auto"); }
  }
  function rootOverflow(value) {
    $( "html" ).css("overflow",value);
    $( actUpon(Ayuu.DOM.rootApp) ).css("overflow-y",value);
  }
};

Ayuu.ScrollTo = function(id) {
  // Before scrolling, this tests that the user is indeed at UI depth=0, and doesnt attempt
  // to scroll on mobile devices. Call this instead of .scrollIntoView() method.

  let operand;
  if (!Ayuu.sensed.Portrait && !Ayuu.sensed.Landscape) {

    operand = actUpon(id);
    if (operand && Ayuu.atDepth===0) {
      operand.scrollIntoView();
      Ayuu.JotFocus(id);
    }
  }
};

Ayuu.DisableLink = function(id, newstate) {
  // `newstate` (optional):  "reenable"  to remove the disabled status instead.

  // Webflow buttons use <a> tags, and at times you might need to make such a button un-clickable.
  // Whereas <button> tags can be marked as disabled, there is no equivalent for <a> tags.
  // This solution is derived from https://a11y-guidelines.orange.com/en/articles/disable-elements/
  let operand = actUpon(id);
  if (operand) {
    if (newstate==="reenable") {
      operand.setAttribute("href","#");
      operand.setAttribute("role","button");
      operand.removeAttribute("aria-disabled");
    } else {
      operand.removeAttribute("href");
      operand.setAttribute("role","link");
      operand.setAttribute("aria-disabled","true");
    }
  }
};

Ayuu.DisableButtonsByClass = function(targetclass, el, newstate) {
  // Adds the `disabled` attribute to all <button> tags of the `targetclass` which are children of the parent `el`.
  // If [string] `el` is not specified, this acts on the whole DOM.
  // `newstate` (optional) accepts:    "reenable"  to remove their disabled attribute instead.

  let aimed, aimLength;
  if (typeof(el)!=="string") {
    aimed = document.querySelectorAll("button."+targetclass);
  } else {
    try {
      aimed = actUpon(el).querySelectorAll("button."+targetclass);
    } catch (e) {
      aimed = document.querySelectorAll("button."+targetclass);
    }
  }
  aimLength = aimed.length;
  for (let i=0; i<aimLength; i++) {
    if(newstate==="reenable"){
      aimed[i].removeAttribute("disabled");
    } else {
      aimed[i].setAttribute("disabled","");
    }
  }
};


/* ----------------------------------- */
/* Monitoring of keyboard focus        */

Ayuu.JotFocus = function(id) {  // Log `id` as having the last-known cursor focus.
  if (typeof(id)==="string") {
    Ayuu.focus.prior = id;
    if (Ayuu.DEBUG){ Ayuu.Cs(10,[id]) };
  }
}

Ayuu.focus.Init = function(arrExceptions) {
  let operands = getFocusableIds(Ayuu.focus.nodes),
      operandsLength, arrLength;
  if (Array.isArray(arrExceptions)) {
    arrLength = arrExceptions.length;
    for (let j=0; j<arrLength; j++) { 
      operands = Ayuu.Helper.RemoveFromArray(operands, arrExceptions[j]);
    }
  } else if (typeof(arrExceptions)==="string") {
    operands = Ayuu.Helper.RemoveFromArray(operands, arrExceptions);
  }
  if (Ayuu.DEBUG){ Ayuu.Cs(120,[operands]) }
  operandsLength = operands.length;
  for (let i=0; i<operandsLength; i++) { 
    getId( operands[i] ).setAttribute("onfocus","Ayuu.JotFocus(this.id)");
  }

  function getFocusableIds(arrIds) { 
    // `arrIds`: an array of parent ids whose children will be tracked for keyboard focus
    // TODO: dont require that they have been given ids

    if (Ayuu.DEBUG){ Ayuu.Cs(130,[arrIds]) }
    let arrLength    = arrIds.length,
        arrElems     = [],
        focusableIds = [],
        elemsLength, harvestNodes, parentId, extractId;
    
    for (let i=0; i<arrLength; i++) {
      parentId = actUpon(arrIds[i]);
      if (parentId) {
        
        // scan for elements w tabindex 0:
        harvestNodes = parentId.querySelectorAll("[id][tabindex='0']");
        arrElems = arrElems.concat(Array.prototype.slice.call(harvestNodes));
        
        // scan for elements w tabindex -1:
        harvestNodes = parentId.querySelectorAll("[id][tabindex='-1']");
        arrElems = arrElems.concat(Array.prototype.slice.call(harvestNodes));

        // be sure to include parents nodes themselves
        if (parentId.getAttribute("tabindex")==="0"||parentId.getAttribute("tabindex")==="-1") {
          focusableIds.push(parentId.getAttribute("id"));
        }

        if (Ayuu.DEBUG){ Ayuu.Cs(135,[arrIds[i]]) }
      }
    }
    elemsLength = arrElems.length;
    for (let j=0; j<elemsLength; j++) { 
      extractId = arrElems[j].getAttribute("id");
      //TODO: if it doesnt have an id, generate one.
      focusableIds.push(extractId); 
    }
    return focusableIds; 
  };
};

Ayuu.ChangeLayer = function(newdepth, id) {
  if (Ayuu.DEBUG){ Ayuu.Cs(150,["prior",newdepth,id]) }
  if (Ayuu.atDepth===0) {  // user is starting from depth 0
    if (typeof(newdepth)==="number") {
      if (newdepth>0) {           // …moving up from 0 to a specific depth #
        Ayuu.setDepth = newdepth;
        if (typeof(id)==="string"){ Ayuu.focus.depth[newdepth]=id; }
        listenForEsc(true);       // when above depth 0, need to listen for Esc
      } else {}                   // do nothing if passed 0 or -1, as user is already at the base level
    } else if (newdepth==="+1") { // …moving up +1 from 0
      Ayuu.setDepth = Ayuu.focus.depth[0]+1;
      if (typeof(id)==="string"){ Ayuu.focus.depth[Ayuu.atDepth]=id; }
      listenForEsc(true);         // when above depth 0, need to listen for Esc
    }
  } else {                   // user was already above depth 0
    if (typeof(newdepth)==="number") {
      if (newdepth>0) {            // …moving up to a specific depth #
        Ayuu.setDepth = newdepth;
        if (typeof(id)==="string"){ Ayuu.focus.depth[newdepth]=id; }
        trimLog();
      } else if (newdepth<0) {     // …moving down by relative change, eg. -1
        Ayuu.setDepth = Ayuu.focus.depth[0] + newdepth;
        trimLog();
      } else if (newdepth===0) {
        listenForEsc(false);
      }
    } else if (newdepth==="+1") {   // …moving up by +1
      Ayuu.setDepth = Ayuu.focus.depth[0]+1;
      if (typeof(id)==="string"){ Ayuu.focus.depth[Ayuu.atDepth]=id; }
      trimLog();
    }
  }
  if (Ayuu.DEBUG){ Ayuu.Cs(150,["now",newdepth]) }
  return Ayuu.atDepth;

  function listenForEsc(setstate) {
    // If no `setstate` is specified, assumed as true (ie, yes, start listening).
    if (!setstate) {
      document.removeEventListener("keydown", Ayuu.Helper.InterceptEsc); 
      Ayuu.clrDepth = 0;
      if (Ayuu.DEBUG){ Ayuu.Cs(160) }
    } else {
      let delayM = setTimeout(function() {
         document.addEventListener("keydown", Ayuu.Helper.InterceptEsc);
      }, uuVF );
    }
  }
  function trimLog() {
    if (Ayuu.atDepth<=0){ listenForEsc(false); Ayuu.clrDepth=0; return; }
    if (Ayuu.atDepth<2) {   // Clears the log of any layer2 markers
      Ayuu.focus.depth[2] = "";
      Ayuu.focus.depth[3] = [0,0];
      //Ayuu.focus.depth[4] = "";       // TODO: EXTEND?
      //Ayuu.focus.depth[5] = "";
    }
  }
};




/* --------------------------------------------- */
/* Fix Webflow's native Lightbox affordances     */

//  These interventions must happen when the element `.w-lightbox-container` gets created in realtime,
//  so these functions wait for the lightbox trigger to be clicked:

Ayuu.wf.AllowFixing = function() {
  let wfLightboxes = document.querySelectorAll(Ayuu.DOM.lightboxTrigger),
      countLightboxes = wfLightboxes.length,
      countWfTriggers;
  // itemize webflow-native lightboxes:
  for (let i=0; i<countLightboxes; i++) {
    // Is it followed by a snippet of JSON = that verifies it's an actionable lightbox
    if (wfLightboxes[i].querySelector(Ayuu.DOM.lightboxTriggerJs) !== null) {
      let a    = wfLightboxes[i].getAttribute("id"),
          thmb = wfLightboxes[i].querySelector("img"),
          altx = wfLightboxes[i].getAttribute("uu-alt-text"),
          note, filename;
      if (thmb !== null ) {
        note = "thumbnail";
        filename = thmb.getAttribute("src").split("/");
        filename = filename[filename.length-1];
      } else {
        note = "no thumb"; 
      }
      if (!altx) {
        if (note === "thumbnail") {
          // fallback to the thumbnail's alt text if no better Alt text was provided in a custom property `uu-alt-text`
          altx = thmb.getAttribute("alt");
          if (Ayuu.DEBUG){ Ayuu.Cs(200,[false,a,filename,altx]) }
        }
      } else {
        if (Ayuu.DEBUG){ Ayuu.Cs(200,[true,a,filename,altx]) }
      }
      Ayuu.wf.triggers[i] = [a,note,altx];
    }
  }
  // Prime each trigger link to also run the fixing process:
  countWfTriggers = Ayuu.wf.triggers.length;
  for (let j=0; j<countWfTriggers; j++) {
    Ayuu.log.lightbox.push(false);                          // initialize the log
    
    getId(Ayuu.wf.triggers[j][0])
     .addEventListener("click", fixAtRuntime.bind(null, j)); // listen for when it gets clicked
  }
  function fixAtRuntime(idx) {
    let aimed = Ayuu.wf.triggers[idx],
        setText;
    if (Ayuu.DEBUG){ Ayuu.Cs(220,[aimed]) }
    if (typeof(aimed[2])!=="string" || aimed[2]==="") {
      setText = Ayuu.strings.en.altFallback;
    } else {
      setText = aimed[2];
    }
    Ayuu.wf.RectifyLightbx(idx, setText);
  };
};

Ayuu.wf.TestForSuddenClose = function(expected) {
  // Though rare, it’s possible for the user to Esc-close a native Lightbox before A11yuu’s listener was ready to catch it; 
  // If so, the tracked depth will be equal to `expected` parameter, yet no lightbox will be found in the DOM tree.
  // This function tests for such a condition at 0.9s later, and updates the tracking log to reflect reality.
  
  if (typeof(expected)!=="number") { expected = 1; }
  let waitForUI = setTimeout(function() {
    if ( Ayuu.atDepth===expected && !document.body.contains( actUpon(Ayuu.DOM.lightboxPane.id)) ) {
      if (Ayuu.DEBUG){ Ayuu.Cs(240) }
      Ayuu.ChangeLayer(-1); 
    }
  }, uuSlow);
};

Ayuu.wf.RectifyLightbx = function(logIdx, forcedText) {
  // `logIdx`: index of which item in the array, Ayuu.log.lightbox, to act upon.
  // `forcedText` is already calculated and passed here automatically by Ayuu.wf.AllowFixing()
  
  let z = Ayuu.ChangeLayer("+1", Ayuu.DOM.lightboxTrigger),
      waitForWf;
  
  Ayuu.wf.TestForSuddenClose(z);
  waitForWf = setTimeout(function() {

    let closeId = "close-btn-uu-id_"+logIdx.toString(),
        elClose,
        elPane  = actUpon(Ayuu.DOM.lightboxPane.id),
        lbx, lbxPane, lbxWrap, lbxHeading;

    if (typeof(forcedText)!=="string") {
      forcedText = Ayuu.strings.en.altFallback;
    }
    if (document.body.contains(elPane) ) {
      lbxPane = $( elPane );

      // Fix once:
          // Heading & close button:
          if (Ayuu.log.lightbox[logIdx]!==true) {
            lbx = lbxPane.parent();
            lbxWrap = lbx.parent();
            lbxHeading = $("<h3 class='"+Ayuu.DOM.scaffolds+"' tabindex='-1'></h3>").text(Ayuu.strings.en.describeLbox);
            lbxWrap.prepend(lbxHeading);
            Ayuu.log.lightbox[logIdx] = true;
            lbx.find(Ayuu.DOM.lightboxCloseBtn).attr("id",closeId);
          }

      // Fix every time:
          // Add the missing alt text:
          lbxPane.find(Ayuu.DOM.lightboxImg)[0].setAttribute("alt", forcedText);

          // Empower the close button to resume underscrolling
          elClose = actUpon(closeId);
          if (elClose) {
            elClose.addEventListener("click", function() { Ayuu.ChangeLayer(-1); });
            elClose.addEventListener("keydown", function(e) {
              if (e.code==="Space"||e.code==="Enter") { Ayuu.ChangeLayer(-1); }
            });
          }
    }
  }, uuMs);
};


/* ----------------------------------------- */
/* Toggletips                                */

Ayuu.setTrigger.ActivatesToggleTips = function() {
  let operand = actUpon(Ayuu.TogTips.triggerIO);
  if (operand) {
    operand.addEventListener("click", function(e) {
      e.preventDefault();  e.stopPropagation(); Ayuu.TogTips.Enabled("switch");
    });
  }
};

Ayuu.TogTips.Enabled = function(setstate) {
  // `setstate` accepts:  true, false, "switch"
  // If no parameter is given, it defaults to `false`

  let trigger = getId(Ayuu.TogTips.triggerIO),
      domBody = getBody();
  if (setstate==="switch"){
    if (domBody.classList.contains(Ayuu.TogTips.modeOFF)) {
      domBody.classList.remove(Ayuu.TogTips.modeOFF); 
      Ayuu.AriaPress(trigger,"press"); 
      return;
    } else {
      domBody.classList.add(Ayuu.TogTips.modeOFF); 
      Ayuu.AriaPress(trigger,"unpress"); 
      return;
    }
  } else if (setstate===true) {
    domBody.classList.remove(Ayuu.TogTips.modeOFF); 
    Ayuu.AriaPress(trigger,"press"); 
    return;
  } else {
    domBody.classList.add(Ayuu.TogTips.modeOFF); 
    Ayuu.AriaPress(trigger,"unpress"); 
    return;
  }
};

Ayuu.TogTips.HasLeft = function() {
  // Evaluates true when cursor focus entered a Toggletip but then moved beyond it.

  let evaluand = Ayuu.focus.depth[3],
      criteria = [1,1];
  if (Ayuu.Helper.CompareArrays(evaluand,criteria)) { 
    return true; 
  } else { 
    return false; 
  }
};

Ayuu.TogTips.Init = function () {
  let ttTerms = getClass(Ayuu.TogTips.kwClass),
      ttTermsLength,
      ttWrappers = getClass(Ayuu.TogTips.containerClass),
      ttWrapsLength,
      ttActionBtns = getClass(Ayuu.TogTips.btnClass),
      ttBtnsLength,
      tInnerLinks,
      ttLinksLength;

  // clicking directly on a keyword (the word, not its button) should close any open toggles:
  ttTermsLength = ttTerms.length;
  for (let i=0; i<ttTermsLength; i++) {
    ttTerms[i].addEventListener("mouseup", function(){
      if (Ayuu.focus.depth[2]==="term") {
        Ayuu.TogTips.CollapseAll();
      } else {
        Ayuu.TogTips.CollapseAll("passive");
      }
    });
  }
  // iterate to empower each trigger btn to open its content
  ttBtnsLength = ttActionBtns.length;
  for (let i=0; i<ttBtnsLength; i++) { 
    ttActionBtns[i].setAttribute("onclick","Ayuu.ToggleMe(this.id)");
  }

  ttWrapsLength = ttWrappers.length;
  for (let i=0; i<ttWrapsLength; i++) {

    ttWrappers[i].addEventListener("focus", function() {
      let unSuspend;
      Ayuu.focus.suspend = true;
      Ayuu.ttipEntered = 1;

      if (Ayuu.DEBUG){ Ayuu.Cs(310) }
      if (Ayuu.TogTips.HasLeft()) { 
        event.preventDefault(); 
        Ayuu.TogTips.CursorHasExited("prior"); 
      } else {
        unSuspend = setTimeout(function(){ Ayuu.focus.suspend = false; }, uuFast);
      }
    });

    ttWrappers[i].addEventListener("keydown", function() { 
      // Keypresses inside a tip are being tracked to detect when focus changes:
      //  *Assumption:* in our UI, all tips include exactly 1 hyperlink which could (ergo) take focus away from the wrapper.
      
      let unSuspend;
      if (!Ayuu.focus.suspend) { 
        if (!event.shiftKey && event.code == "Tab") {
          Ayuu.focus.suspend = true;
          Ayuu.ttipEntered = 1;
          if (Ayuu.DEBUG){ Ayuu.Cs(320,[1]) }
          unSuspend = setTimeout(function(){ Ayuu.focus.suspend = false; }, uuFast);
        } else if (
          event.shiftKey && event.code == "Tab") {
          Ayuu.focus.suspend = true;
          Ayuu.TogTips.CursorHasExited();
        }
      }
    });

    tInnerLinks = ttWrappers[i].getElementsByTagName("A");
    ttLinksLength = tInnerLinks.length;
    for (let h=0; h<ttLinksLength; h++) {

      tInnerLinks[h].addEventListener("keydown", function() {
        let unSuspend;
        if (!Ayuu.focus.suspend) {
          if (event.shiftKey && event.code == "Tab") {
            Ayuu.ttipTraverse = 0;
            Ayuu.focus.suspend = true;
            unSuspend = setTimeout(function(){ Ayuu.focus.suspend = false; }, uuFast);
            
            if (Ayuu.DEBUG){ Ayuu.Cs(320,[-1]) }

          } else if ( !event.shiftKey && event.code == "Tab") {
            Ayuu.focus.suspend = true;
            unSuspend = setTimeout(function(){ Ayuu.focus.suspend = false; }, uuFast);
            Ayuu.ttipTraverse = 1;

            if (Ayuu.DEBUG){ Ayuu.Cs(320,[2]) }
              
            if (Ayuu.TogTips.HasLeft()) { 
              event.preventDefault(); 
              Ayuu.TogTips.CursorHasExited("prior"); 
            }
          }
        }
      });
    }
  } //end loop ttWrappers
};

Ayuu.TogTips.CursorHasExited = function(refocus) {
  // `refocus` (optional) accepts:  "prior"  to make the function perform RestoreFocus() as well.

  let unSuspend;

  if (Ayuu.atDepth!==0) {
    if (Ayuu.DEBUG){ Ayuu.Cs(330,[2]) }
    Ayuu.TogTips.CollapseAll();
    if (refocus==="prior") { Ayuu.RestoreFocus(); }
  }
  unSuspend = setTimeout(function(){ Ayuu.focus.suspend = false; }, uuMs);
  return;
};

Ayuu.TogTips.Collapse = function(el) {
  let itsTerm = Ayuu.Helper.ExpectedSiblingByClass(el, Ayuu.TogTips.kwClass);

  actUpon(el).setAttribute("aria-expanded","false");
  if (itsTerm) {
    itsTerm[0].classList.remove("active");
  }
  Ayuu.ChangeLayer(-1);
};

Ayuu.TogTips.CollapseAll = function(exceptThisId) {
  // Parameter (string) `exceptThisId` will exclude that one id from being closed
  // Or if no parameter is given, then all Toggletips are closed.

  let itsTerm,
      allOpenTips,
      allOpenCount;

  if (typeof(exceptThisId)!=="string") { 
    Ayuu.ChangeLayer(-1);
    Ayuu.ttipReset = 0;
    exceptThisId = "none";
  }
  if (exceptThisId==="passive") { 
    Ayuu.ttipReset = 0;
    exceptThisId = "none";
  }

  allOpenTips = document.querySelectorAll('button[aria-expanded="true"]');
  allOpenCount = allOpenTips.length;
  for (let i=0; i<allOpenCount; i++) {
    itsTerm = Ayuu.Helper.ExpectedSiblingByClass(allOpenTips[i], Ayuu.TogTips.kwClass);
    if (itsTerm) {
      itsTerm[0].classList.remove("active");
    }
    if (allOpenTips[i].getAttribute("id")!==exceptThisId) {
      allOpenTips[i].setAttribute("aria-expanded", "false");
    }
  }
};

/* The following is a derivation of:       */
/* Toggle-tip by Adrian Roselli            */
/* https://codepen.io/aardrian/pen/NWpoVQd */
/* MIT License                             */

Ayuu.ToggleMe = function(id) {
  Ayuu.TogTips.CollapseAll(id);
  Ayuu.ttipReset = 0;
  let aimed = document.getElementById(id),
      relatedTerm = Ayuu.Helper.ExpectedSiblingByClass(aimed, Ayuu.TogTips.kwClass);

  if (aimed.getAttribute("aria-expanded")=="false") { 

    // Expand it:
    aimed.setAttribute("aria-expanded","true");
    if (Ayuu.DEBUG){ Ayuu.Cs(330,[1]) }
    if (relatedTerm) {
      relatedTerm[0].classList.add("active");
    }
    Ayuu.ChangeLayer("+1","term");
    Ayuu.focus.prior = id;
    if (typeof(relatedTerm[1])==="string") {
        document.getElementById(relatedTerm[1]+"_defined").focus();
    }
  } else {

    // Collapse it:
    Ayuu.TogTips.Collapse(aimed);
    if (Ayuu.DEBUG){ Ayuu.Cs(330,[0]) }
  }
};

/* -------------------------------------------------- */
/* SoundFX Captioning                                 */

Ayuu.setTrigger.ActivatesCaptions = function () {
  let operand = actUpon(Ayuu.fxCC.triggerIO),
      aimed, aimLength;

  // Empower the main setting button which turns sound captioning ON/off:
  if (operand) {
    operand.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      Ayuu.fxCC.Show("switch");
    });
  }
  // Empower all inline 'Hide' buttons where captions are being shown:
  aimed = getClass(Ayuu.fxCC.inlineBtns);
  aimLength = aimed.length;
  for (let i=0; i<aimLength; i++) {  
    aimed[i].addEventListener("click", function(){ Ayuu.fxCC.Show(false); });
  }
};

Ayuu.fxCC.Show = function(setstate) {
  let mainTrigger = actUpon(Ayuu.fxCC.triggerIO),
      aimed = getClass(Ayuu.fxCC.container),
      domBody = getBody(),
      aimLength = aimed.length,
      pausedState = getClass(Ayuu.fxCC.audioPlayer)[0].paused;

  if (setstate==="query") {
    if (domBody.classList.contains(Ayuu.fxCC.modeON)) { 
      return true; 
    } else { return false; }
  } else if (setstate==="switch") {
    if (domBody.classList.contains(Ayuu.fxCC.modeON)) { 
      manageHiddenStates(); return; 
    } else { manageShownStates(); return; }
  } else if (setstate===false) {
    manageHiddenStates(); return;
  } else if (setstate===true) {
    manageShownStates(); return;
  }
  function manageHiddenStates() {
    for (let i=0; i<aimLength; i++) {
      aimed[i].classList.add(Ayuu.DOM.displayNone);
    }
    setTimeout(function() {
      domBody.classList.remove(Ayuu.fxCC.modeON); 
      Ayuu.AriaPress(mainTrigger,"unpress");
    }, uuFast);
  }
  function manageShownStates() {
    domBody.classList.add(Ayuu.fxCC.modeON);
    Ayuu.AriaPress(mainTrigger,"press");
    if(!pausedState) {
      for (let i=0; i<aimLength; i++) {
        aimed[i].classList.remove(Ayuu.DOM.displayNone);
      }
    }
  }
};


/* -------------------------------------------------- */
/* Keyboard Shortcuts                                 */

Ayuu.setTrigger.ActivatesShortcuts = function() {
  // Empowers the relevant buttons to activate keyboard shortcuts.

  let arrA = Ayuu.kbshort.triggers.passive,
      arrB = Ayuu.kbshort.triggers.direct,
      arrControls = arrA.concat(arrB),
      arrLength = arrControls.length,
      operand;
  for (let m=0; m<arrLength; m++) { 
    operand = actUpon(arrControls[m]);
    if (operand) {
      operand.addEventListener("click", function(e) {
        e.preventDefault(); e.stopPropagation(); Ayuu.kbshort.Show(true, arrControls[m]);
      });
    }
  }
};

Ayuu.kbshort.InterceptKeys = function(listenFor) {
  if (listenFor==="basepage") {
    // Stop listening for digits; start listening for letters:
    document.removeEventListener("keypress", Ayuu.Extend.listeners.ShortcutsNumberedTabs);
    document.addEventListener("keypress", Ayuu.Extend.listeners.ShortcutsBasepage );

  } else if (listenFor==="tabs") {
    //stop listening for letters; start listening for digits:
    document.removeEventListener("keypress", Ayuu.Extend.listeners.ShortcutsBasepage );
    document.addEventListener("keypress", Ayuu.Extend.listeners.ShortcutsNumberedTabs);

  } else if (listenFor==="query") {
    let response;
    switch(Ayuu.atDepth) {
      case 1:
        document.removeEventListener("keypress", Ayuu.Extend.listeners.ShortcutsBasepage );
        document.addEventListener("keypress", Ayuu.Extend.listeners.ShortcutsNumberedTabs);
        response = "tabs";
        break;
      case 0:
      default:
        document.removeEventListener("keypress", Ayuu.Extend.listeners.ShortcutsNumberedTabs);
        document.addEventListener("keypress", Ayuu.Extend.listeners.ShortcutsBasepage );
        response = "basepage";
    }
    return response;

  } else if (listenFor===false) {
    // Stop listening:
    document.removeEventListener("keypress", Ayuu.Extend.listeners.ShortcutsBasepage );
    document.removeEventListener("keypress", Ayuu.Extend.listeners.ShortcutsNumberedTabs);
  }
};

Ayuu.kbshort.Show = function(setstate, elInvoked, elShow, elFocus) {
  // Turns on the keyboard shortcuts for the page. For now, this is a one-way intervention; A11yuu cannot unshow them. 
  // Ergo, any buttons which call this function become disabled or hidden afterwards, so as not to be pressed twice or confused for a toggle.

  // `setstate` accepts:
  //     "query" = returns the current state but does not take any actions.
  //     false   is not supported right now.
  //     true    is assumed if `setstate` is not provided.
  // `elInvoked`:  id of the button pressed by user; it (or its parent) will be hidden.
  // `elShow`  (optional): id for one `div.uu-assist-section` that should be revealed immediately; if not specified, 
  //     the function acts upon the id stored in keyb.shortcuts.visuals. 
  //     Any other `div.uu-assist-section` on the page will be revealed at the end of the process (as being less urgent).
  // `elFocus` (optional): a specific id to set the cursor focus to subsequently, overriding the normal target.

  let domBody = getBody();
  if (setstate==="query") {
    if ( domBody.classList.contains(Ayuu.kbshort.modeON)
      && Ayuu.log.kbshort.enabled) { 
      return true; 
    } else { 
      return false; 
    }
  }
  if (setstate===false) { 
    //for now, false does nothing
    return;
  }
  if (!Ayuu.log.kbshort.enabled) {

    let arrayA = Ayuu.kbshort.triggers.passive,
        arrayB = Ayuu.kbshort.triggers.direct,
        arrControls = arrayA.concat(arrayB),
        arrLength = arrControls.length,
        rewriteAria = "",
        invoked, otherCues, headingId, headingEl, voicedId, j;

    //  Before activating the shortcuts, determine whether this is
    //  a direct request (to scrollTo & announce w/ screenreader), and
    //  which legends to reveal immediately, and where the cursor focus will go:
    if (!Ayuu.log.kbshort.revealed) {
      if (typeof(elShow)!=="string") {
        elShow = actUpon(Ayuu.kbshort.legendWrapper);
      } else {
        elShow = actUpon(elShow);
      }
      if (typeof(elFocus)!=="string") {
        elFocus = elShow;
      } else {
        elFocus = actUpon(elFocus);
      }
      if (arrayA.includes(elInvoked)) {
        invoked = "passive"; elInvoked = actUpon(Ayuu.kbshort.btnWrapper);
      } else if (arrayB.includes(elInvoked)) {
        invoked = "direct";  elInvoked = actUpon(Ayuu.kbshort.btnWrapper);
      } else {
        invoked = "direct";  elInvoked = actUpon(elInvoked);
      }
    }

    kbShortcutsActive(true, arrControls);  // make the shortcuts active

    if (!Ayuu.log.kbshort.revealed) {      // finish revealing and move focus
      if (elInvoked && elShow) {
        setTimeout(function() {
          Ayuu.Grow(elShow);                   // show explanation on-screen
          if (invoked==="direct" & elFocus) {  // move focus if appropriate
            Ayuu.ScrollTo(elFocus);
            elFocus.focus();
          }
        }, uuXVF);

        // Urgent: first, hide the instigating element
        Ayuu.Hide(elInvoked);

        // Any tabs inside of Better Boxes should explain their available shortcuts:
        if (Ayuu.bbox.dimens.count>=1) {
          retitleTabs();
          for (j=1; j<=Ayuu.bbox.dimens.count; j++) {
            headingId = bboxNamed(j)+Ayuu.bbox.naming.heading;
            voicedId  = bboxNamed(j)+Ayuu.bbox.naming.narrate;
            headingEl = actUpon(headingId);

            if (headingEl && document.getElementById(voicedId)!==null) {
              rewriteAria = headingEl.getAttribute("aria-describedby")+" "+voicedId;
              headingEl.setAttribute("aria-describedby",rewriteAria);
            }
          }
        }
        // Less urgent: hide any other controllers
        for (let m=0; m<arrLength; m++) {
          if (arrControls[m]!==elInvoked.getAttribute("id")) {
            Ayuu.Hide(arrControls[m]);
          }
        }
        // Least urgent: reveal any other visual cues
        otherCues = getClass(Ayuu.kbshort.legendClass);
        countOthers = otherCues.length;
        for (let i=0; i<countOthers; i++) { Ayuu.Grow(otherCues[i]); }
        
        // revealing is complete:
        Ayuu.log.kbshort.revealed = true;
      }
    }
  }

  function kbShortcutsActive(newstate, controllers) {
    let countCtrls = controllers.length;
    // make active:
    if (newstate) {
      domBody.classList.remove(Ayuu.kbshort.modeOFF);
      domBody.classList.add(Ayuu.kbshort.modeON);

      for (let m=0; m<countCtrls; m++) {
        Ayuu.AriaPress( getId(controllers[m]), "press"); 
      }
      Ayuu.kbshort.InterceptKeys("query");
      Ayuu.log.kbshort.enabled = true;
    } // make inactive:
      else if (newstate===false) {
      domBody.classList.remove(Ayuu.kbshort.modeON);
      domBody.classList.add(Ayuu.kbshort.modeOFF);
      for (let m=0; m<countCtrls; m++) {
        Ayuu.AriaPress( getId(controllers[m]), "unpress"); 
      }
      Ayuu.kbshort.InterceptKeys(false);
      Ayuu.log.kbshort.enabled = false;
    }
    return Ayuu.log.kbshort.enabled;
  }

  function retitleTabs() {
    let classOuter = parseAs('§',Ayuu.wf.tablink.labels),
        classInner = parseAs('§',Ayuu.wf.tablink.title),
        titlesInTabX, countOuter, countInner, itsParts, thisTitle, i, j, k;
    
    for (i=0; i<Ayuu.bbox.dimens.maxtabs; i++) {
      titlesInTabX = getClass(classOuter.split("{%1}")[0] + 
          (i+1).toString() + 
          classOuter.split("{%1}")[1]);
      countOuter = titlesInTabX.length;
      for (j=0; j<countOuter; j++) {
        itsParts = ""; 
        thisTitle = titlesInTabX[j].getElementsByClassName(classInner);
        countInner = thisTitle.length;
        for (k=0; k<countInner; k++) {
          itsParts = itsParts + thisTitle[k].innerHTML;
        }
        titlesInTabX[j].innerHTML = reformat(itsParts, i+1);
      }
    }
    function reformat(pieces, numbered) {  // TODO
      let markup = [
        "<span class='assistive-blue'>&nbsp;",   "&nbsp;</span> "
      ];
      return markup[0] + String(numbered) + markup[1] + pieces;
    }
  }
};


/* -------------------------------------------------- */
/* High Contrast Mode                                 */

Ayuu.setTrigger.ActivatesContrast = function () {
  let aimed = Ayuu.contrast.triggersIO,
      aimLength = aimed.length,
      operand;

  for (let m=0; m<aimLength; m++) { 
    operand = actUpon(aimed[m]);
    if (operand) {
      operand.addEventListener("click", function(e) {
        e.preventDefault(); e.stopPropagation(); Ayuu.contrast.High("switch");
      });
      if (Ayuu.DEBUG){ Ayuu.Cs(590,[aimed[m]]) }
    }
  }
};

Ayuu.contrast.High = function(setstate) {  
  // `setstate` accepts: 
  //       true   [default]
  //       false
  //       "switch"
  //       "query"  → returns the current state but takes no action.
  
  let domBody = getBody();
  if (setstate==="query") {
    if (domBody.classList.contains(Ayuu.contrast.modeON)) { 
      return true;
    } else { return false; }

  } else if (setstate==="switch") {
    if (domBody.classList.contains(Ayuu.contrast.modeON)) {
      useHiContrast(false); 
      return;
    } else { useHiContrast(true); return;}

  } else if (setstate===false) {
    useHiContrast(false); 
    return;
  } else { 
    useHiContrast(true);
    return; 
  }

  function useHiContrast(newstate) {
    let countTriggers = Ayuu.contrast.triggersIO.length,
        operand, directive, colloquial;
    if (newstate) {
      domBody.classList.add(Ayuu.contrast.modeON);
      directive = "press";
      colloquial = "on";
    } else {
      domBody.classList.remove(Ayuu.contrast.modeON);
      directive = "unpress";
      colloquial = "off";
    }
    my_actions_when_high_contrast_is_set(colloquial);

    for (let m=0; m<countTriggers; m++) {
      operand = actUpon(Ayuu.contrast.triggersIO[m]);
      if (operand) {
        Ayuu.AriaPress(operand, directive);
      } 
    }
  }
};


/* -------------------------------------------------- */
/* Better Boxes                                       */

Ayuu.bbox.Init = function() { 
  // hides any Better Boxes that were left visible by accident:

  let bttrBoxes = $(parseAs('.', Ayuu.bbox.class.main)),
      clssClose =   parseAs('.', Ayuu.bbox.class.close),
      clssTabs  =   parseAs('.', Ayuu.wf.tablink.parent)+" "+parseAs('.', Ayuu.wf.tablink.class),
      clssHide  =   parseAs('§', Ayuu.DOM.displayNone),
      clssReveal=   parseAs('§', Ayuu.bbox.class.reveal),
      tabCounts =   [];
  bttrBoxes.removeClass(clssReveal).addClass(clssHide);
  Ayuu.bbox.dimens["count"] = bttrBoxes.length;
  if (Ayuu.DEBUG){ Ayuu.Cs(400) }
  bttrBoxes.each(function(idx) {
    let ownerId = $(this).attr("id");
    $(this)
      .data("tabCount", $(this).find(clssTabs).length)
      .find(clssClose)
        .attr({ 
          "id": function(){ return ownerId+"_close"; }, 
          "uu-owner": function(){ return ownerId; }
        })

        .on("keydown", function(e) {
          // pressing Enter is already handled by the browser like a click, 
          //   but Space keypress needs to be captured:
          if (e.code==="Space") { 
            e.preventDefault(); 
            // Simulate a real mouseclick to trigger any Webflow Interactions
            Ayuu.Helper.SimulateClick($(this));
          } else {  return;  }
        })

        .on("click", function(e) {
          e.preventDefault(); 
          e.stopPropagation();
          Ayuu.bbox.Unmount($(this).attr("uu-owner"));
        });

    Ayuu.bbox.dimens[ownerId] = {};
    Ayuu.bbox.dimens[ownerId]["tabs"] = $(this).data("tabCount");
    tabCounts.push($(this).data("tabCount"));

    if (Ayuu.DEBUG){ Ayuu.Cs(410, [$(this)[0].id, "."+$(this)[0].className]) }
  });
  let a = 0;
  for (const b of tabCounts) { a = Math.max(a, b); }
  Ayuu.bbox.dimens["maxtabs"] = a;
};

Ayuu.bbox.RelateThisPair = function(trigger, dialogId) {
  let repairs = {}, triggerControls, thisDialog;
  trigger = actUpon(trigger);

  if (trigger) {
    if (trigger.getAttribute("tabindex")!=="0"||trigger.getAttribute("tabindex")!=="-1") {
      repairs["tabindex"]="0";
    }
    if (trigger.getAttribute("aria-haspopup")!=="dialog") {
      repairs["aria-haspopup"] = "dialog";
    }
    triggerControls = trigger.getAttribute("aria-controls").trim();
    if (triggerControls.length===0) {
      repairs["aria-controls"] = dialogId;
    } else {
      repairs["aria-controls"] = triggerControls+" "+dialogId;
    }
    if (Ayuu.DEBUG){ Ayuu.Cs(420,[trigger.id, Object.entries(repairs)]) }
    for (var [attrib, value] of Object.entries(repairs)) {
      trigger.setAttribute(attrib, value);
    }
    for (var pairing in repairs) delete repairs[pairing];  // reuse the variable

    thisDialog = getId(dialogId);   // already known to exist from earlier
    if (thisDialog.getAttribute("role")!=="dialog") {
      repairs["role"] = "dialog";
    }
    if (thisDialog.getAttribute("aria-modal")!=="true") {
      repairs["aria-modal"] = "true";
    }
    for (var [attrib, value] of Object.entries(repairs)) {
      thisDialog.setAttribute(attrib, value);
    }
    if (Ayuu.DEBUG){
      Ayuu.Cs(420,[thisDialog.id, Object.entries(repairs)]);
      if (thisDialog.getAttribute("aria-label")===""){ Ayuu.Cs(430, [thisDialog]) }
    }
  }
};

Ayuu.bbox.Mount = function(n, instigator) {
  let causalId = instigator,
      bboxId, thisBbox, firstFocusable, lastFocusable, queryElements;
  if (typeof(n)==="number") {
    bboxId = bboxNamed(n);
    thisBbox = actUpon(bboxId);
  } else {
    thisBbox = actUpon(n);
    if (thisBbox) { bboxId = thisBbox.getAttribute("id"); }
  }

  if (thisBbox) {
    thisBbox.setAttribute("uu-launched", causalId);
    Ayuu.UnderScrolling(false);           // Disable movement on baselayer
    Ayuu.Unhide(thisBbox);                // Reveal the dialog 
    Ayuu.ChangeLayer("+1", bboxId);       // Immediately listen for Esc
    my_actions_upon_mounting_dialog(bboxId, "urgent");

    firstFocusable = actUpon(bboxId+Ayuu.bbox.naming.heading);
    
    //TODO: evaluate for lastFocusable(s)
    // should this be done only once and logged?

    for (const child of thisBbox.children) {
      // If has ("div.w-tabs") and is :last-child,  then scan each ("div.w-tab-pane") for [tabindex="0"], [tabindex="-1"],
      //    listen for keydown on *each* tab pane’s last tabbable.

      queryElements = thisBbox.querySelectorAll("select, input, textarea, button, a");
      queryElements.item([queryElements.length-1]);  // the last one in DOM order

      // But if ("div.w-tabs") has a subsequent sibling, then scan through its last sibling for that one’s lastTab,
      //    TODO:  filter down to what’s :visible now
      //    listen for keydown on *only* that last tabbable.
    }

    if (firstFocusable) {

      firstFocusable.addEventListener("keydown", 
        // Trap focus:
        function(e) {
          if ((e.key === "Tab" && e.shiftKey)) {
            e.preventDefault();
            if (typeof(lastFocusable)!=="undefined") {
              lastFocusable.focus();            // redirect a [shift+Tab] to last input
            } else {
              //TODO:  try {} catch(e) {}
              getId(bboxId+"_close").focus();   // fallback if querying hasn’t finished
            }
          }
      });

      firstFocusable.focus();                   // Move cursor into the modal
    }
    
    Ayuu.DisableLink(causalId);                 // Disable the origin element
    
    // Less urgent: 
    lastFocusable.addEventListener("keydown", function(e) {
        if ((e.key === "Tab" && !e.shiftKey)) {
          e.preventDefault();
          firstFocusable.focus();
        }
    });
    Ayuu.bbox.RelateThisPair(causalId, bboxId); // check & fix the ARIA relationship
    my_actions_upon_mounting_dialog(bboxId, "deferred");

  } else {
    throw new ErrorUnknownId("mounting ‘"+bboxId+"’");
  }
};

Ayuu.bbox.Unmount = function(targetId) {

  let thisBbox = actUpon(targetId),
      parsedId, causalId, n = "";

  if (thisBbox) {
    causalId = thisBbox.getAttribute("uu-launched");
    parsedId  = targetId.split("_");

    // determine which part in the naming pattern holds its digit:
    let m = Ayuu.bbox.naming.base.split("{%1}")[0].split("_").length;
    m = m-1;

    if (parsedId[0] === Ayuu.bbox.naming.base.split("_")[0]) {
      if ( typeof(parseInt( parsedId[m].slice(-2)))==="number" ) {
        n = parseInt(parsedId[m].slice(-2));
      } else {
        n = parseInt(parsedId[m].slice(-1));
      }
    }
    if (Ayuu.DEBUG){ Ayuu.Cs(450, [targetId,n,causalId]) }

    Ayuu.ChangeLayer(-1);            // Immediately remove Esc listener
    my_actions_upon_unmounting_dialog(targetId, causalId, "urgent");


    Ayuu.DisableLink(causalId,"reenable");  // Re-enable the origin element
    Ayuu.UnderScrolling(true);              // Re-enable scrolling of baselayer
    getId(causalId).focus();                // Move cursor back where it was
    Ayuu.Hide(targetId);                    // Re-hide the dialog
    //TODO: remove EventListener("keydown") on focusables?
    my_actions_upon_unmounting_dialog(targetId, causalId, "deferred");

  } else {
    throw new ErrorUnknownId("unmounting ‘"+targetId+"’");
  }
};


/* ----------------------------------------------------- */
/* Extend the functionality                              */
/* by adding new properties/methods to Ayuu              */
/*                                                       */

/**   Define your Shortcut Keys   **/

Ayuu.Extend.Shortcuts = {
  "basepage": {
    "doThis": { 
      "keyCode":   "KeyQ", 
      "labelAs":   "Q", 
      "idVocalize":"voiced_1", 
      "idClick":   "this_particular_id"
    },
    "doThat": { 
      "keyCode":   "KeyF", 
      "labelAs":   "F", 
      "idVocalize":"voiced_2", 
      "idClick":   "that_particular_id"
    }
  },
  "my_special_modal": {

  }
};

/**   Define the actions to run when
 *    user presses each Shortcut Key       **/

Ayuu.Extend.listeners = {};
Ayuu.Extend.listeners.ShortcutsBasepage = function(event) {

  // Shortcuts available when at Depth 0:
  if (Ayuu.DEBUG){ Ayuu.Cs(500)}
  switch(event.code) {
    case Ayuu.Extend.Shortcuts.basepage.doThis.keyCode: 
      event.preventDefault();
      //
      // Your code here, such as...
      clickUpon(Ayuu.Extend.Shortcuts.basepage.doThis.idClick); 
      //
      break;

    case Ayuu.Extend.Shortcuts.basepage.doThat.keyCode:
      event.preventDefault();
      //
      // Your code here, such as...
      clickUpon(Ayuu.Extend.Shortcuts.basepage.doThat.idClick); 
      //
      break;
  }
  function clickUpon(id) {
    let z = setTimeout(function() { $( actUpon(id) )[0].click(); }, uuMs);
  }
};

Ayuu.Extend.listeners.ShortcutsNumberedTabs = function(event) {
  // Shortcuts available when at a tabbed UI inside a Better Box:

  let openModal = String(Ayuu.focus.depth[1]);  //TODO: abstract to a tabbed interface @ depth=2 ?
  let n = parseInt(openModal.slice(-1));
  let finalTab = Ayuu.bbox.dimens[openModal]["tabs"];
  let aimedId = "", 
  pressedX = String(event.code).charAt(5);
  if (Ayuu.DEBUG){ Ayuu.Cs(550, [openModal,finalTab]) }
  switch(event.code) {
    case "Digit1": 
    case "Digit2": 
    case "Digit3": 
    case "Digit4": 
    case "Digit5":
      if (parseInt(pressedX)>=1 && parseInt(pressedX)<=finalTab) {
        aimedId = parseAs('#', bboxNamed(n))+Ayuu.wf.tablink.suffix+pressedX;
        $(aimedId)[0].click();
      }
      break;
  }
  if (Ayuu.DEBUG && aimedId){ console.log(" → click enacted on "+aimedId); }
};



/* ------------------------------------------------ */
/*  Do things relevant to your Use-case:            */
/*                                                  */

function my_actions_when_the_Esc_key_requests_closure(current_depth, id_open_at_layer1, id_open_at_layer2) {

  // This function is called when the Escape key has been pressed 
  // on an open (and perhaps modal) dialog.  Modify below to your own
  // use-cases, based on which dialog/popup is being requested to close.

  //   NOTE: Shutting down a dialog by way of its Close button happens elsewhere
  //   via two listeners on that button, added during Ayuu.bbox.Init:
  //     .on("keydown")  and  .on("click")
  //   That process runs a single command:  Ayuu.bbox.Unmount(`dialog_id`);

  switch( current_depth ) {

    case 1:
      // User is on a dialog at depth 1. So they expect
      // to return to the basepage layer, with their
      // cursor focus placed where it was before.
      
      switch( id_open_at_layer1 ) {
        
        case "term":
          Ayuu.TogTips.CollapseAll();
          Ayuu.RestoreFocus();
          break;

        case "dialog_1":
          //
          // your code…
          //
          Ayuu.RestoreFocus();
          break;

        default:
          Ayuu.bbox.Unmount(id_open_at_layer1);
      }
      break;

    case 2:
      // User is on a popup at depth 2. So they expect
      // to return to the dialog that's open at layer 1.
    
      switch( id_open_at_layer2 ) {

        case "term":
          Ayuu.TogTips.CollapseAll(); 
          break;

        case "dialog_8":
          //
          // your code…
          //
          break;

        case "dialog_9":
          //
          // your code…
          //
          break;
        default:
          // your code…
      }
      break;
  }
};


function my_actions_upon_mounting_dialog(dialog_id, urgency) {

  // This function is invoked twice during Ayuu.bbox.Mount(), each with different `urgency`.
  // In either case, the .ChangeLayer() has aleady occurred, so the current depth is up +1,
  // and the new dialog is already visible on-screen.

  switch(dialog_id) {

    case "dialog_1":

      switch(urgency) {
        case "urgent":
          // (Cursor focus is still on the link that launched this dialog, but focus will
          //  be moved onto the dialog’s heading after your code runs.)
          //
          // Your code…
          //
          break;

        case "deferred":
          // Any deferred steps here occur in the milliseconds AFTER the user is able to 
          // move arond the new dialog's interface.
          //
          // Your code…
          //
          break;

        default:
      }
      break;

    case "dialog_2":

      switch(urgency) {
        case "urgent":
          //
          // Your urgent steps
          //
          break;

        case "deferred":
          //
          // Your deferred steps
          //
          break;

        default:
      }
      break;

    default:
  }
};

function my_actions_upon_unmounting_dialog(dialog_id, launcher_id, urgency) {

  // This function is invoked twice during Ayuu.bbox.Unmount(), each with different `urgency`.
  // In either case, the .ChangeLayer() has aleady occurred → So the current depth is down -1,
  // and the Esc listener has already been cancelled.

  switch(dialog_id) {

    case "dialog_1":

      switch(urgency) {
        case "urgent":
          // (The dialog box is still visible on-screen but will be hidden right after your code runs.)
          //
          // Your code…
          //
          break;

        case "deferred":
          // Any deferred steps here (such as state cleanup) occur after the dialog box has
          // already been hidden & the user is already able to move about the underlying UI.
          //
          // Your code…
          //
          break;

        default:
          // your code…
      }
      break;

    case "dialog_2":

      switch(urgency) {
        case "urgent":
          //
          // Your urgent steps
          //
          break;
        case "deferred":
          //
          // Your deferred steps
          //
          break;

        default:
          // your code…
      }
      break;

    default:
  }
};

function my_actions_when_high_contrast_is_set(status) {

  if (status==="on") {
    //
    // Your code…
    //
  } else if (status==="off") {
    //
    // Your code…
    //
  }
};