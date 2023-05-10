// ==UserScript==
// @name         STN Player Debug Buttons
// @namespace    stnplayerdebugbutton
// @description  Debug Buttons for STN Player
// @Author       Steven Hall
// @version      10
// @match        *://*/*
// @grant        none
// @updateURL    https://cdn.jsdelivr.net/gh/stn-stevenh/player-debug-tampermonkey@master/player-debug.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/stn-stevenh/player-debug-tampermonkey@master/player-debug.user.js
// @noframes
// ==/UserScript==

// TODO:
// - Check for non floating reason button - Needs to have STN Debug enabled
// - Fix logging - Dev Server is IP blocked

(
    function()
    {
        'use strict';

        const searchParams = new URLSearchParams(location.search);
        const isDebug      = searchParams.get('stnDebug') === '1';

        const debugModeTitle = `${isDebug ? 'Disable' : 'Enable'} Player Debug`;

        const buttonFuncs = {
            'Check Common Player Issues': playerIssues,
            'Scroll To Next Player':      scrollToNextPlayer,
            [debugModeTitle]:             toggleSearchParam('stnDebug'),
        };
        const numberOfButtons = Object.keys(buttonFuncs).length;

        const container = document.createElement('div');
        container.setAttribute('id', 'stn-debugger-container');

        const title = document.createElement('h3');
        title.setAttribute('id', 'stn-debugger-title');
        title.textContent = "STN Player Debugger";
        container.appendChild(title);

        const buttons = [];
        Object.entries(buttonFuncs).forEach
        (
            ([ name, func ], idx) =>
            {
                // Create a button element
                const myButton = document.createElement('button');
                myButton.classList.add('stn-debugger-button');
                myButton.innerText = name;

                myButton.addEventListener
                (
                    'click',
                    () =>
                    {
                        func();
                    }
                );

                // Add the button to the page
                container.appendChild(myButton);
                buttons.push(myButton);
            }
        );

        let xPos = 0;
        let yPos = 0;

        // add event listeners to the container
        container.addEventListener("mousedown", mouseDown, {passive: false});
        container.addEventListener("touchstart", touchStart, {passive: false});

        document.body.appendChild(container);

        setDefaultCSS
        (
            container,
            {
                'position':    'fixed',
                'bottom':      '20px',
                'right':       '20px',
                'cursor':      'grab',
                'display':     'none',
                'z-index':     '2147483647',
                'padding':     '10px',
                'background':  '#045473',
                'border':      '3px solid rgb(0 145 201)',
                'box-shadow':  'grey 5px 5px 10px 0px',
                'font-family': 'monospace',
            }
        );

        setDefaultCSS
        (
            title,
            {
                'color':       'white',
                'text-align':  'center',
                'margin':      '7px 0px 17px 0px',
                'font-family': 'monospace',
            }
        );

        buttons.forEach
        (
            (button, idx) =>
            {
                const styles = {
                    'padding':     '10px',
                    'cursor':      'pointer',
                    'background':  'white',
                    'font-family': 'monospace',
                    'color':       'black',
                };

                // No margin on the last button
                if (idx < numberOfButtons - 1)
                {
                    styles['margin-bottom'] = '10px';
                }

                setDefaultCSS(button, styles);
            }
        );

        // Create a MutationObserver to watch for changes to the page
        let haveCreatedModal = false;
        const observer = new MutationObserver
        (
            (mutations, observer) =>
            {
                // Check if there are any stn-player elements on the page
                const stnPlayers = document.querySelectorAll('stn-player');
                const shouldShowButton = stnPlayers.length > 0;

                // Show or hide the button based on whether there are any stn-player elements
                container.style.setProperty('display', shouldShowButton ? 'grid' : 'none', 'important');

                if (shouldShowButton && !haveCreatedModal)
                {
                    haveCreatedModal = true;
                    createModal();
                }
            }
        );

        // Start observing the body for mutations
        observer.observe
        (
            document.body,
            {
                childList: true,
                subtree: true,
            }
        );

        function getDefaultCSS(node, property)
        {
            const ele = document.createElement(node.tagName);
            document.body.appendChild(ele);

            const styles = window.getComputedStyle(ele);
            const value = styles.getPropertyValue(property);

            document.body.removeChild(ele);
            return value;
        };

        function setDefaultCSS(node, overrides = {}, ignore = [])
        {
            if (!node)
            {
                return;
            }

            const humanReadable = generateSelector(node);

            // Create a new stylesheet
            const style = document.createElement('style');
            style.classList.add('stn-modal-styles');
            document.head.appendChild(style);

            // Add a CSS rule to reset all styles for the element
            const rules = [
                `${humanReadable}:not(#dummy1):not(#dummy2):not(#dummy3)`,
                '{',
                '    all: revert !important;',
                '}',
            ];

            Object.entries(overrides).forEach
            (
                ([ styleName, value ]) =>
                {
                    node.style.setProperty(styleName, value, 'important');
                    // rules.push(`    ${styleName}: ${value} !important;`);
                }
            );

            style.textContent = rules.join('\n');
        };

        let fixes = {};
        let issues = [];

        function addFix(node, prop)
        {
            const humanNode = generateSelector(node);

            if (!fixes[humanNode])
            {
                fixes[humanNode] = {};
            }

            fixes[humanNode][prop] = getDefaultCSS(node, prop);
        }

        function playerIssues()
        {
            const findIssues = function ( node )
            {
                /* the root element (HTML). */
                if ( ! node || node.nodeName === 'HTML' )
                {
                    return true;
                }

                /* handle shadow root elements. */
                if ( node.nodeName === '#document-fragment' )
                {
                    return findIssues( node.host, issues );
                }

                const computedStyle = getComputedStyle( node );

                /* Player is hidden */
                if ( computedStyle.display === 'none' )
                {
                    addFix(node, 'display');
                    issues.push({ node: node, reason: `display: ${ computedStyle.display }` });
                }

                /* position: fixed or sticky. */
                if ( computedStyle.position === 'fixed' || computedStyle.position === 'sticky' )
                {
                    addFix(node, 'position');
                    issues.push({ node: node, reason: `position: ${ computedStyle.position }` });
                }

                /* positioned (absolutely or relatively) with a z-index value other than "auto". */
                if ( computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static' )
                {
                    addFix(node, 'z-index');
                    issues.push({ node: node, reason: `position: ${ computedStyle.position }; z-index: ${ computedStyle.zIndex }` });
                }

                /* elements with an opacity value less than 1. */
                if ( computedStyle.opacity !== '1' )
                {
                    addFix(node, 'opacity');
                    issues.push({ node: node, reason: `opacity: ${ computedStyle.opacity }` });
                }

                /* elements with a transform value other than "none". */
                if ( computedStyle.transform !== 'none' )
                {
                    addFix(node, 'transform');
                    issues.push({ node: node, reason: `transform: ${ computedStyle.transform }` });
                }

                /* elements with a mix-blend-mode value other than "normal". */
                if ( computedStyle.mixBlendMode !== 'normal' )
                {
                    addFix(node, 'mix-blend-mode');
                    issues.push({ node: node, reason: `mix-blend-mode: ${ computedStyle.mixBlendMode }` });
                }

                /* elements with a filter value other than "none". */
                if ( computedStyle.filter !== 'none' )
                {
                    addFix(node, 'filter');
                    issues.push({ node: node, reason: `filter: ${ computedStyle.filter }` });
                }

                /* elements with a backdrop-filter value other than "none". */
                if ( computedStyle.backdropFilter !== 'none' )
                {
                    addFix(node, 'backdrop-filter');
                    issues.push({ node: node, reason: `backdrop-filter: ${ computedStyle.backdropFilter }` });
                }

                /* elements with a perspective value other than "none". */
                if ( computedStyle.perspective !== 'none' )
                {
                    addFix(node, 'perspective');
                    issues.push({ node: node, reason: `perspective: ${ computedStyle.perspective }` });
                }

                /* elements with a clip-path value other than "none". */
                if ( computedStyle.clipPath !== 'none' )
                {
                    addFix(node, 'clip-path');
                    issues.push({ node: node, reason: `clip-path: ${ computedStyle.clipPath } ` });
                }

                /* elements with a mask value other than "none". */
                const mask = computedStyle.mask || computedStyle.webkitMask;
                if ( mask !== 'none' && mask !== undefined )
                {
                    addFix(node, 'mask');
                    addFix(node, '-webkit-mask');
                    issues.push({ node: node, reason: `mask:  ${ mask }` });
                }

                /* elements with a mask-image value other than "none". */
                const maskImage = computedStyle.maskImage || computedStyle.webkitMaskImage;
                if ( maskImage !== 'none' && maskImage !== undefined )
                {
                    addFix(node, 'mask-image');
                    addFix(node, '-webkit-mask-image');
                    issues.push({ node: node, reason: `mask-image: ${ maskImage }` });
                }

                /* elements with a mask-border value other than "none". */
                const maskBorder = computedStyle.maskBorder || computedStyle.webkitMaskBorder;
                if ( maskBorder !== 'none' && maskBorder !== undefined )
                {
                    addFix(node, 'mask-border');
                    addFix(node, '-webkit-mask-border');
                    issues.push({ node: node, reason: `mask-border: ${ maskBorder }` });
                }

                /* elements with isolation set to "isolate". */
                if ( computedStyle.isolation === 'isolate' )
                {
                    addFix(node, 'isolation');
                    issues.push({ node: node, reason: `isolation: ${ computedStyle.isolation }` });
                }

                /* transform or opacity in will-change even if you don't specify values for these attributes directly. */
                if ( computedStyle.willChange === 'transform' || computedStyle.willChange === 'opacity' )
                {
                    addFix(node, 'will-change');
                    issues.push({ node: node, reason: `will-change: ${ computedStyle.willChange }` });
                }

                /* elements with -webkit-overflow-scrolling set to "touch". */
                if ( computedStyle.webkitOverflowScrolling === 'touch' )
                {
                    addFix(node, '-webkit-overflow-scrolling');
                    issues.push({ node: node, reason: '-webkit-overflow-scrolling: touch' });
                }

                /* an item with a z-index value other than "auto". */
                if ( computedStyle.zIndex !== 'auto' )
                {
                    const parentStyle = getComputedStyle( node.parentNode );
                    /* with a flex|inline-flex parent. */
                    if ( parentStyle.display === 'flex' || parentStyle.display === 'inline-flex' )
                    {
                        addFix(node, 'z-index');
                        issues.push({ node: node, reason: `flex-item; z-index: ${ computedStyle.zIndex }` });
                    }
                    /* with a grid parent. */
                    else if ( parentStyle.grid !== 'none / none / none / row / auto / auto' )
                    {
                        addFix(node, 'z-index');
                        issues.push({ node: node, reason: `child of grid container; z-index: ${ computedStyle.zIndex }` });
                    }
                }

                /* contain with a value of layout, or paint, or a composite value that includes either of them */
                const contain = computedStyle.contain;
                if ( [ 'layout', 'paint', 'strict', 'content' ].indexOf( contain ) > -1 || contain.indexOf( 'paint' ) > -1 || contain.indexOf( 'layout' ) > -1)
                {
                    addFix(node, 'contain');
                    issues.push({ node: node, reason: `contain: ${ contain }` });
                }

                return findIssues( node.parentNode, issues );
            };

            const players = Array.from(document.querySelectorAll('stn-player'));

            if (!players.length)
            {
                content = [
                    "No players found on the page.",
                ];

                modalContent(content.join("<br>"));
                hideStyleButtons();
                console.warn(content.join("\n"));
                showModal();
                return;
            }

            let msg = [];
            const fixCSS = [];

            players.forEach
            (
                player =>
                {
                    const playerKey = player.playerKey;
                    issues = [];
                    findIssues(player);

                    console.log({ playerKey, issues });

                    if (issues.length)
                    {
                        msg.push(`- ${playerKey}:`);

                        issues.forEach
                        (
                            ({ node, reason }) =>
                            {
                                const humanNode = generateSelector(node);
                                msg.push(`    - ${humanNode} -> ${reason}`);
                                log
                                (
                                    {
                                        playerKey,
                                        node: humanNode,
                                        reason,
                                        url: window.location.href,
                                    }
                                );
                            }
                        );
                    }
                }
            );

            fixCSS.push("<pre id='stn-fix-code-modal' style='max-height: 250px !important; overflow: auto !important; padding: 10px !important; border: 1px solid white !important; margin-bottom: 20px !important'>");

            Object.entries(fixes).forEach
            (
                ([ humanNode, css ]) =>
                {
                    fixCSS.push(`${humanNode}:not(#stnPriority1):not(#stnPriority2):not(#stnPriority3)`);
                    fixCSS.push('{');

                    Object.entries(css).forEach
                    (
                        ([ propName, value ]) =>
                        {
                            // fixCSS.push(`    ${propName}: ${value} !important;`);
                            fixCSS.push(`    ${propName}: revert !important;`);
                        }
                    );

                    fixCSS.push('}');
                }
            );

            fixCSS.push("</pre>");

            if (msg)
            {
                let content = [];
                if (msg.length)
                {
                    content = [
                        "Player issues found  👎:",
                        "",
                        "See below for the CSS to provide to the publisher which should fix this.",
                        "",
                        "If they find that it has no effect, then they may already have CSS that is overriding these proposed changes.",
                        "",
                        fixCSS.join("\n"),
                    ];
                    console.warn("Player issues found  👎:\n\n" + msg.join("\n"));
                    showStyleButtons();
                }
                else
                {
                    content = [
                        "Could not find any player issues on page. 👍",
                    ];
                    hideStyleButtons();
                }

                modalContent(content.join("<br>"));
                showModal();

                setDefaultCSS
                (
                    document.querySelector('#stn-fix-code-modal'),
                    {}
                );
            }
        }

        function scrollToNextPlayer()
        {
            const players = document.querySelectorAll('stn-player');
            let nextPlayer;

            // Loop through all stn-player elements
            players.forEach
            (
                player =>
                {
                    const rect = player.getBoundingClientRect();

                    // If the player is below the current scroll position and hasn't been found yet
                    if (rect.top > 1 && !nextPlayer)
                    {
                        nextPlayer = player;
                    }
                }
            );

            if (!nextPlayer && players.length)
            {
                nextPlayer = players[0];
            }

            // If a next player was found, scroll to it
            if (nextPlayer)
            {
                nextPlayer.scrollIntoView({ behavior: 'smooth', block: 'start', });
            }
        }

        function hexCode(value)
        {
            return '%' + value.charCodeAt(0).toString(16);
        }

        function objectToUrlQuery(obj)
        {
            return Object.entries(obj).map
            (
                ([key, value]) =>
                {
                    while (typeof(value) === 'function')
                    {
                        value = value();
                    }

                    switch (typeof(value))
                    {
                        case 'boolean':
                        case 'number':
                        case 'string':
                        case 'symbol':
                        case 'bigint':
                            value = `${value}`;
                            break;
                        case 'undefined':
                        case 'object':
                            if (!value)
                            {
                                return null;
                            }

                            if(value instanceof Set)
                            {
                                value = [...value];
                            }

                            if (Array.isArray(value))
                            {
                                value = value.join(',');
                            }
                            else
                            {
                                value = objectToUrlQuery(value);
                            }
                    }

                    key   = key.replace(/[#=&%]/g, hexCode);
                    value = value.replace(/[#&%+]/g, hexCode);

                    return `${key}=${value}`;
                }
            )
                .filter(v => v)
                .join('&');
        }

        function log(data)
        {
            // const url = `https://stevendev.sendtonews.com/debug-tool.php?${objectToUrlQuery(data)}`;
            // navigator.sendBeacon(url);
        }


        function generateSelector( node, selector = '' )
        {
            if (!node)
            {
                return selector;
            }

            let tag = node.nodeName.toLowerCase();
            if (tag === 'html')
            {
                return selector;
            }
            else if (tag === '#document-fragment')
            {
                return generateSelector(node.host, selector);
            }


            let newSelector = '';
            if ( node.id )
            {
                newSelector = '#' + node.getAttribute( 'id' );
            }
            else if ( node.getAttribute( 'class' ) )
            {
                newSelector = '.' + node.getAttribute( 'class' ).split( ' ' ).join( '.' );
            }

            newSelector = newSelector ? tag + newSelector : tag;

            if (selector)
            {
                return generateSelector(node.parentNode, `${newSelector} > ${selector}`)
            }
            else
            {
                return generateSelector(node.parentNode, `${newSelector}`)
            }
        }

        function toggleSearchParam(param)
        {
            return () =>
            {
                const url = new URL(location.href);
                const value = url.searchParams.get(param);
                if (value === '1')
                {
                    url.searchParams.delete(param);
                }
                else
                {
                    url.searchParams.set(param, '1');
                }
                location.href = url.href;
            }
        }

        function createModal()
        {
            // Create modal elements
            const modalContainer = document.createElement('div');
            modalContainer.setAttribute('id', 'stn-modal-container');

            const modalContent = document.createElement('div');
            modalContent.setAttribute('id', 'stn-modal-content');

            const modalTitle = document.createElement('h2');
            modalTitle.innerText = 'Player Debug Info';
            modalTitle.setAttribute('id', 'stnModalTitle');
            modalContent.appendChild(modalTitle);

            const modalText = document.createElement('div');
            modalText.setAttribute('id', 'stn-modal-text')
            modalContent.appendChild(modalText);

            const closeModalButton = document.createElement('button');
            closeModalButton.innerText = 'Close';
            closeModalButton.setAttribute('id', 'stn-close-modal');
            modalContent.appendChild(closeModalButton);

            const copyButton = document.createElement('button');
            copyButton.innerText = 'Copy Styles';
            copyButton.setAttribute('id', 'stn-copy-modal');
            modalContent.appendChild(copyButton);

            const applyButton = document.createElement('button');
            applyButton.innerText = 'Apply Styles to Page';
            applyButton.setAttribute('id', 'stn-apply-modal');
            modalContent.appendChild(applyButton);

            modalContainer.appendChild(modalContent);
            document.body.appendChild(modalContainer);

            setDefaultCSS
            (
                modalContainer,
                {
                    'background': '#045473',
                    'font-family': 'monospace',
                    'position':   'fixed',
                    'top':        '50%',
                    'display':    'none',
                    'left':       '50%',
                    'transform':  'translate(-50%, -50%)',
                    'z-index':    '99999999999999',
                    'padding':    '20px',
                    'border':     '3px solid rgb(0 145 201)',
                    'min-width':  '350px',
                    'max-width':  '500px',
                    'width':      '90vw',
                    // 'min-height': '300px',
                    'max-height': '70vh',
                    'height':     'fit-content',
                    'overflow':   'auto',
                    'color':      'white',
                },
            );

            setDefaultCSS
            (
                modalContent,
                {
                }
            );

            setDefaultCSS
            (
                modalTitle,
                {
                    'color': 'white',
                    'margin-top': '0px',
                }
            );

            setDefaultCSS
            (
                modalText,
                {
                    'margin-bottom': '17px',
                }
            );

            setDefaultCSS
            (
                closeModalButton,
                {
                    'background': 'white',
                    'padding':    '7px',
                    'cursor':     'pointer',
                    'color':      'black',
                }
            );

            setDefaultCSS
            (
                copyButton,
                {
                    'background': 'white',
                    'padding': '7px',
                    'margin-left': '5px',
                    'cursor': 'pointer',
                    'color':      'black',
                }
            );

            setDefaultCSS
            (
                applyButton,
                {
                    'background': 'white',
                    'padding': '7px',
                    'margin-left': '5px',
                    'cursor': 'pointer',
                    'color':      'black',
                }
            );

            closeModalButton.addEventListener('click', hideModal);

            applyButton.addEventListener
            (
                'click',
                () =>
                {
                    const styleCode = modalText.querySelector('pre').textContent;
                    const styleEl = document.createElement('style');
                    styleEl.classList.add('stn-fix-styles');

                    styleEl.textContent = styleCode;

                    document.head.appendChild(styleEl);
                    playerIssues();
                    console.log(styleEl);
                }
            );
            copyButton.addEventListener
            (
                'click',
                () =>
                {
                    const styleCode = modalText.querySelector('pre');
                    copyTextToClipboard(styleCode);
                }
            );
        }

        function modalContent(content)
        {
            const modalText = document.querySelector('#stn-modal-text');
            modalText.innerHTML = content;
        }

        function showModal()
        {
            const modalContainer = document.querySelector('#stn-modal-container');
            modalContainer.style.setProperty('display', 'block', 'important');
        }

        function hideModal()
        {
            const modalContainer = document.querySelector('#stn-modal-container');
            modalContainer.style.setProperty('display', 'none', 'important');
        }

        function mouseDown(event)
        {
            event.preventDefault();

            // calculate the initial mouse position relative to the container
            xPos = container.offsetWidth - (event.clientX - container.getBoundingClientRect().left);
            yPos = container.offsetHeight - (event.clientY - container.getBoundingClientRect().top);

            // add event listeners for dragging and releasing the container
            document.addEventListener("mousemove", mouseMove, {passive: false});
            document.addEventListener("mouseup", mouseUp, {passive: false});

            container.style.setProperty('cursor', 'grabbing', 'important');
        }

        function touchStart(event)
        {
            event.preventDefault();

            // calculate the initial touch position relative to the container
            xPos = container.offsetWidth - (event.touches[0].clientX - container.getBoundingClientRect().left);
            yPos = container.offsetHeight - (event.touches[0].clientY - container.getBoundingClientRect().top);

            // add event listeners for dragging and releasing the container
            document.addEventListener("touchmove", touchMove, {passive: false});
            document.addEventListener("touchend", touchEnd, {passive: false});

            container.style.setProperty('cursor', 'grabbing', 'important');
        }

        function mouseMove(event)
        {
            event.preventDefault();

            // calculate the new position of the container based on the mouse position
            const newXPos = event.clientX - (container.offsetWidth - xPos);
            const newYPos = event.clientY - (container.offsetHeight - yPos);

            // set the container's position to the new position
            container.style.setProperty('right', window.innerWidth - newXPos - container.offsetWidth + "px", 'important');
            container.style.setProperty('bottom', window.innerHeight - newYPos - container.offsetHeight + "px", 'important');
        }

        function touchMove(event)
        {
            event.preventDefault();

            // calculate the new position of the container based on the touch position
            const newXPos = event.touches[0].clientX - (container.offsetWidth - xPos);
            const newYPos = event.touches[0].clientY - (container.offsetHeight - yPos);

            // set the container's position to the new position
            container.style.right = window.innerWidth - newXPos - container.offsetWidth + "px";
            container.style.bottom = window.innerHeight - newYPos - container.offsetHeight + "px";
        }

        function mouseUp(event)
        {
            // remove the event listeners for dragging and releasing the container
            document.removeEventListener("mousemove", mouseMove, {passive: false});
            document.removeEventListener("mouseup", mouseUp, {passive: false});

            container.style.setProperty('cursor', 'grab', 'important');
        }

        function touchEnd(event)
        {
            // remove the event listeners for dragging and releasing the container
            document.removeEventListener("touchmove", touchMove, {passive: false});
            document.removeEventListener("touchend", touchEnd, {passive: false});

            container.style.setProperty('cursor', 'grab', 'important');
        }

        function hideStyleButtons()
        {
            const copy = document.querySelector('#stn-copy-modal');
            const apply = document.querySelector('#stn-apply-modal');

            copy.style.setProperty('display', 'none', 'important');
            apply.style.setProperty('display', 'none', 'important');
        }

        function showStyleButtons()
        {
            const copy = document.querySelector('#stn-copy-modal');
            const apply = document.querySelector('#stn-apply-modal');

            copy.style.setProperty('display', 'inline-block', 'important');
            apply.style.setProperty('display', 'inline-block', 'important');
        }

        function copyTextToClipboard(element)
        {
            // Get the text from the element
            const text = element.innerText;

            // Create a temporary textarea element to hold the text
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);

            // Select the text and copy it to the clipboard
            textarea.select();
            document.execCommand('copy');

            // Remove the temporary textarea element
            document.body.removeChild(textarea);
        }
    }
)();
