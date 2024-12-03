# Devlog Entry - 11/15/24

## Introducing the Team
1. Tools Lead - Krithik Dhandapani
2. Engine Lead - Myles Anderrson
3. Design Lead - Saima Mukadam

## Tools and Materials
1. We will use the Phaser framework for our game. We chose Phaser because we each have some experience using it in the past.
2. We will use Javascript as Phaser requires us to code in Javascript..
3. We will use tools such as VS Code and GitHub for our project. For our assets we may use Aseprite or other asset creation tools. We made these choices as we have experience using these tools for various projects.
4. Our alternate platform choice is Unity which is quite different from Phaser as it uses C# but our choice may change in the future.

## Outlook
We are hoping to accomplish creating a game with good visuals and mechanics. We anticipate the hardest part of the project will be trying to make a finished and polished game within the timeframe, but we will strive to meet our goals and achieve our vision. We are hoping to learn more about developing a game in a team and gain more experience in Phaser.

# Devlog Entry (F0) - 12/2/24

## How we satisfied the software requirements
### F0.a:
We created a two dimensional grid by having two for loops that create the vertical and horizontal lines, then using a phaser graphics game object we followed and traced the movement within these two for loops to create our grid. Then using a simple green box serving as the player we implemented a simple arrow key movement system that moves the player exactly one box in a given direction.
### F0.b:
For the advancement of time requirement, we implemented a “continuous movement” input (F) that allows the player to zip around the playable space, simulating the advancement of time. Upon pressing F again, the player is pulled into the closest box such that turn based movement can proceed.
### F0.c:
For the sowing of crops requirement, we implemented an input “X” that finds the closest box to the center of the player and makes that box brown, simulating the planting of crops. We did this by redesigning the grid structure to help us better find the closest box, as now we needed to directly access the box itself rather than it serving as a background.
### F0.d:
To manage sun and water levels for the grid cells, we have created functions to generate these levels, accumulate water since it behaves differently than sun in the game, and check plant growth. Currently we have text in each cell to display the levels of sun and water per cell.
### F0.e:

### F0.f:

### F0.g:

## Reflection
Looking back on how we achieved the F0 requirements, our plan has changed. The initial roles worked well for setting up our game, but as we kept working we found that instead of having very fixed roles as we did in the beginning, it's more beneficial for us to split up the work as we reach each next step and have everyone participate in everything. We still have our roles, but we aren't adhering to them in a strict manner. We also communicate frequently regarding different steps in the project and when we are stuck on certain parts we consult eachother. This has worked well as having multiple eyes on the same code helps alleviate bugs and other issues much faster. We will likely continue this process for the upcoming final-related assignments.
