// ==UserScript==
// @name         STN Player Debug Buttons
// @namespace    stnplayerdebugbutton
// @description  Debug Buttons for STN Player
// @Author       Steven Hall
// @version      8
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

        // Add some styles to make the button fixed position and always visible
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '2147483647';
        container.style.display = 'none';
        container.style.padding = '10px';
        container.style.background = '#045473';
        container.style.border = '3px solid rgb(0 145 201)';
        container.style.boxShadow = 'grey 5px 5px 10px 0px';
        container.style.fontFamily = 'monospace';

        container.style.cursor = 'grab';

        const title = document.createElement('h3');
        title.style.color = 'white';
        title.style.textAlign = 'center';
        title.style.margin = '7px 0px 17px 0px';
        title.textContent = "STN Player Debugger";
        title.style.fontFamily = 'monospace';

        container.appendChild(title);

        Object.entries(buttonFuncs).forEach
        (
            ([ name, func ], idx) =>
            {
                // Create a button element
                const myButton = document.createElement('button');
                myButton.innerText = name;

                // No margin on the last button
                if (idx < numberOfButtons - 1)
                {
                    myButton.style.marginBottom = '10px';
                }

                myButton.style.padding = '10px';
                myButton.style.cursor = 'pointer';
                myButton.style.background = 'white';
                myButton.style.fontFamily = 'monospace';

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
            }
        );

        let xPos = 0;
        let yPos = 0;

        // add event listeners to the container
        container.addEventListener("mousedown", mouseDown, {passive: false});
        container.addEventListener("touchstart", touchStart, {passive: false});

        function mouseDown(event)
        {
            event.preventDefault();

            // calculate the initial mouse position relative to the container
            xPos = container.offsetWidth - (event.clientX - container.getBoundingClientRect().left);
            yPos = container.offsetHeight - (event.clientY - container.getBoundingClientRect().top);

            // add event listeners for dragging and releasing the container
            document.addEventListener("mousemove", mouseMove, {passive: false});
            document.addEventListener("mouseup", mouseUp, {passive: false});

            container.style.cursor = 'grabbing';
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

            container.style.cursor = 'grabbing';
        }

        function mouseMove(event)
        {
            event.preventDefault();

            // calculate the new position of the container based on the mouse position
            const newXPos = event.clientX - (container.offsetWidth - xPos);
            const newYPos = event.clientY - (container.offsetHeight - yPos);

            // set the container's position to the new position
            container.style.right = window.innerWidth - newXPos - container.offsetWidth + "px";
            container.style.bottom = window.innerHeight - newYPos - container.offsetHeight + "px";
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

            container.style.cursor = 'grab';
        }

        function touchEnd(event)
        {
            // remove the event listeners for dragging and releasing the container
            document.removeEventListener("touchmove", touchMove, {passive: false});
            document.removeEventListener("touchend", touchEnd, {passive: false});

            container.style.cursor = 'grab';
        }

        document.body.appendChild(container);

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
                container.style.display = shouldShowButton ? 'grid' : 'none';

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

            fixCSS.push("<pre style='max-height: 250px; overflow: auto; padding: 10px; border: 1px solid white; margin-bottom: 20px'>");

            Object.entries(fixes).forEach
            (
                ([ humanNode, css ]) =>
                {
                    fixCSS.push(humanNode);
                    fixCSS.push('{');

                    Object.entries(css).forEach
                    (
                        ([ propName, value ]) =>
                        {
                            fixCSS.push(`    ${propName}: ${value};`);
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
                }
                else
                {
                    content = [
                        "Could not find any player issues on page. 👍",
                    ];
                }

                modalContent(content.join("<br>"));
                showModal();
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


        function generateSelector( element )
        {
            let selector, tag = element.nodeName.toLowerCase();
            if ( element.id )
            {
                selector = '#' + element.getAttribute( 'id' );
            }
            else if ( element.getAttribute( 'class' ) )
            {
                selector = '.' + element.getAttribute( 'class' ).split( ' ' ).join( '.' );
            }
            return selector ? tag + selector : tag;
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
            modalContainer.setAttribute('id', 'modal-container');
            modalContainer.style.background = '#045473';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '50%';
            modalContainer.style.left = '50%';
            modalContainer.style.transform = 'translate(-50%, -50%)';
            modalContainer.style.zIndex = '99999999999999';
            modalContainer.style.padding = '20px';
            modalContainer.style.border = '3px solid rgb(0 145 201)';
            modalContainer.style.minWidth = '350px';
            modalContainer.style.maxWidth = '500px';
            modalContainer.style.width = '90vw';
            modalContainer.style.minHeight = '300px';
            modalContainer.style.maxHeight = '70vh';
            modalContainer.style.height = 'fit-content';
            modalContainer.style.overflow = 'auto';
            modalContainer.style.display = 'none';


            const modalContent = document.createElement('div');
            modalContent.setAttribute('id', 'modal-content');

            const modalTitle = document.createElement('h2');
            modalTitle.innerText = 'Player Debug Info';
            modalContent.appendChild(modalTitle);

            const modalText = document.createElement('div');
            modalText.setAttribute('id', 'modal-text')
            modalContent.appendChild(modalText);

            const closeModalButton = document.createElement('button');
            closeModalButton.setAttribute('id', 'close-modal');
            closeModalButton.innerText = 'Close';
            closeModalButton.style.background = 'white';
            closeModalButton.style.padding = '7px';
            modalContent.appendChild(closeModalButton);

            modalContainer.appendChild(modalContent);
            document.body.appendChild(modalContainer);

            closeModalButton.addEventListener('click', hideModal);
        }

        function modalContent(content)
        {
            const modalText = document.querySelector('#modal-text');
            modalText.innerHTML = content;
        }

        function showModal()
        {
            const modalContainer = document.querySelector('#modal-container');
            modalContainer.style.display = 'block';
        }

        function hideModal()
        {
            const modalContainer = document.querySelector('#modal-container');
            modalContainer.style.display = 'none';
        }
    }
)();
