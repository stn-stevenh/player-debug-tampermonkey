javascript:(
    function()
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
)();
