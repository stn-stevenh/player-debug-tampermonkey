// ==UserScript==
// @name         STN Player Debug Buttons
// @namespace    stnplayerdebugbutton
// @description  Debug Buttons for STN Player
// @version      6
// @match        *://*/*
// @grant        none
// ==/UserScript==

(
    function()
    {
        'use strict';

        const scriptSources = {
            'Check Stacking Context':     'https://stevendev.sendtonews.com/bookmarklets/player-stacking-context.js',
            'Check Common Player Issues': 'https://stevendev.sendtonews.com/bookmarklets/player-debug.js',
            'Scroll To Next Player':      'https://stevendev.sendtonews.com/bookmarklets/scroll-to-next-player.js',
            'Toggle Player Debug':        'https://stevendev.sendtonews.com/bookmarklets/toggle-player-debug.js',
        };
        const numberOfButtons = Object.keys(scriptSources).length;

        const container = document.createElement('div');

        // Add some styles to make the button fixed position and always visible
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '2147483647';
        container.style.display = 'none';
        container.style.padding = '10px';
        container.style.background = '#045473';
        container.style.boxShadow = 'grey 5px 5px 10px 0px';

        container.style.cursor = 'grab';

        const title = document.createElement('h3');
        title.style.color = 'white';
        title.style.textAlign = 'center';
        title.style.margin = '7px 0px 17px 0px';
        title.textContent = "STN Player Debugger";

        container.appendChild(title);

        Object.entries(scriptSources).forEach
        (
            ([ name, url ], idx) =>
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

                myButton.addEventListener
                (
                    'click',
                    () =>
                    {
                        const script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.src = url;
                        document.head.appendChild(script);
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
        const observer = new MutationObserver
        (
            (mutations, observer) =>
            {
                // Check if there are any stn-player elements on the page
                const stnPlayers = document.querySelectorAll('stn-player');
                const shouldShowButton = stnPlayers.length > 0;

                // Show or hide the button based on whether there are any stn-player elements
                container.style.display = shouldShowButton ? 'grid' : 'none';
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
    }
)();
