# A11yuu: Accessibility assists for highly interactive UIs
A11yuu is a set of JavaScript helper functions and methods, plus a suggested naming convention for DOM element id’s and CSS classes, that will help you improve web accessibility on any website where you can implement changes at the level of native HTML5. The code is primarily concerned with websites that have complicated user interfaces that feel more like an “app”, rather than text + multimedia documents which are navigated (for the most part) by scrolling up and down. 

These involve the kinds of UI affordances more commonly found in cinematic, storytelling, and interactive “exploratory” websites — such as a lightbox effect, an animated fade-in and fade-to-black, using popup dialogs, or even popups laid on top of popups, or splitting up information into a series of tabs.

## Origin of the project
This repository is being published as “version 0.9” in July 2025.

But the code was prototyped in 2022-2023 by [**auut studio**](https://findauut.com) in a partnership with [**Full Spectrum Education**](https://www.fullspectrum.education/) to build the interactive web experience titled [*Resettlement: Chicago Story*](https://www.fullspectrum.education/projects/rcs). The real impetus began in 2020, however, when [Full Spectrum Features NFP](https://www.fullspectrumfeatures.com/) committed itself to **accessibility** as a co-equal priority in their filmmaking and digital projects. Accessibility for people with disabilities is now an essential part of their core value of inclusivity. The evolution of this thinking described in more detail on the [accessibility statement](https://www.fullspectrum.education/resettlement/a11y) of *Resettlement: Chicago Story.*

The original code was heavily slanted toward making it work for Webflow, because that was the platform of the Resettlement project, and because (as of 2023) Webflow had the strongest commitment/roadmap to A11Y improvements among all the competing platforms. Over time, a lot of this code has been made more flexible so that it might be used any place you are working with HTML and Javascript.

We found it shockingly *hard* during our project to find solutions that help meet the WCAG success criteria. Especially for any website that operates more like a game than a document. *Okay, WCAG guidelines require that we respond to the Escape key, and put the cursor position back where it was…* But no one has a framework to do that?? This is our motivation for open sourcing the code. We’re putting A11yuu out in the world in the hopes that no one else has to struggle as hard as we did.

## Installation
forthcoming!

## FAQ

### What’s with the name?
Well, A11Y is the common abbreviation for web accessibility. And... working here at a**uu**t studio, we sort of have a thing for the double-u. By a turn of coincidence, there’s a term from basketball in the United States known as an *[alley-oop](https://www.merriam-webster.com/dictionary/alley-oop)*, in which someone throws the ball high to their teammate, who leaps above the basket to catch it and — floating there at the precipice of the ultimate goal — dunks it for 2 well-deserved points.

We’d like to imagine these tools as a teammate who’s there to give YOU such an assist. Yeah it's a lofty play, and takes a bit of daring, but we think you can slam dunk this.

### Will installing this finally fix my website’s A11Y problems?
No, this is not a magic fix. And neither are those website overlay/AI-powered plugin solutions on the market. Because the deeper you look into what makes a site accessible, the more you realize that there is no magic fix. 

The fundamental problem of A11Y is that, for three decades, each website owner has meticulously poured their sweat & tears into making an awesome presentation/experience for their content... but *only for people who visit with a monitor screen and a mouse.*  Up ’til now, it didn’t occur to most of us that there is also another VERY common way to explore a website; but that method uses keyboard keys (Tab/Enter/Esc, among others), and the monitor is irrelevant — instead, a voice reads all the words & images aloud.

You’ve most likely spent dozens [if not hundreds] of hours making sure that, no matter what little quirks your content has, the **eye-hand method** comes off really slick. Using A11yuu, you are going to have to spend at least SOME time thinking about (and then improving) the experience of your website for the **keyboard+screen reader** method. For the kinds of fixes you will need to make, A11yuu has already come up with a pattern to follow, a keyboard tracking mechanism, and a bunch of one-line commands to make those a LOT easier.

### What do I need in order to use this?
A11yuu is written in Javascript, so it doesn't depend on what server language you might be using to host your website. The majority of this code is “vanilla” JS.  However, A11yuu **is not plug-and-play:**
- There are some variables at the start of the code that need to be customized to your own scenario. So you need to have a “medium” level of comfort with Javascript, plus a basic understanding of CSS classes. (Or work with a web developer who does.)

At this time* A11yuu does rely on JQuery for some of its functionality.... Mostly when it got too complicated and frustrating to set a dozen and a half Event listeners, or deal with the order of bubbling events.

- So your website will also need to load the JQuery library, and you need a “low” level of comfort with JQuery — enough to understand the syntax for running actions on a particular element of your page.

### Does this work with WordPress?
This isn’t a WordPress plugin, so it is not something you can install in one step. Nor is there a GUI where you can click checkboxes or dropdowns to customize your settings. But tools in the A11yuu code are perfectly compatible to insert as raw code into the ``<HEAD>`` of a WordPress site (if your theme or another plugin gives you a method to do so). Then, its tools become available to your web developer to leverage elsewhere on your site as they write their own code to operate certain features, like a modal dialog box.

### Hey, I could improve the code here.
Awesome... We enthusiastically invite pull requests from developers who have improvements, suggestions, or additional functions to add. (\*Or if you would like to continue rewriting the JQuery parts into vanilla JS.) Let’s improve this set of tools for everybody to use.


