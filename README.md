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

## How we satisfied the software requirements:
### F0.a:
We created a two dimensional grid by having two for loops that create the vertical and horizontal lines, then using a phaser graphics game object we followed and traced the movement within these two for loops to create our grid. Then using a simple green box serving as the player we implemented a simple arrow key movement system that moves the player exactly one box in a given direction.
### F0.b:
For the advancement of time requirement, we implemented a “continuous movement” input (F) that allows the player to zip around the playable space, simulating the advancement of time. Upon pressing F again, the player is pulled into the closest box such that turn based movement can proceed.
### F0.c:
For the sowing of crops requirement, we implemented an input “X” that finds the closest box to the center of the player and makes that box brown, simulating the planting of crops. We did this by redesigning the grid structure to help us better find the closest box, as now we needed to directly access the box itself rather than it serving as a background.
### F0.d:
To manage sun and water levels for the grid cells, we have created functions to generate these levels, accumulate water since it behaves differently than sun in the game, and check plant growth. Currently we have text in each cell to display the levels of sun and water per cell.
### F0.e:
For the different types of crops we added different colors which corresponded to the three different crops, additionally added emojis to display the growth states of each of them. Initially starting with sprouts, mid-stage, then fully grown. When a plant is sown it decreases the water content in the soil to zero, once the water content reaches 50 again and sunlight is 50 the plant goes up one growth stage, once again resetting the water content to zero. 
### F0.f:
We touched on this in F0.e because it made the most sense to have the three different levels be associated with the water and sun variables. However, this time we included a plant proximity condition, where a plant would not grow if surrounded by three plants. This proximity condition also includes diagonals, so the plant would only grow if there are no plants in any of the eight directions. We did this by implementing a neighboring plants helper function that looked in all eight directions accessing if there were plants present in that square. Additionally, if a plant was stunted its ground color would change to a deep red, showing the player the spots conditions were inhabitable. 
### F0.g:
We used a dictionary to keep track of how many plants the user has fully grown in order to compare to the win conditions, if it was greater than or equal to the win condition, a win message would be displayed on the screen. In our case, the player would need to grow at least five of each plant to the highest growth stage.

## Reflection:
Looking back on how we achieved the F0 requirements, our plan has changed. The initial roles worked well for setting up our game, but as we kept working we found that instead of having very fixed roles as we did in the beginning, it's more beneficial for us to split up the work as we reach each next step and have everyone participate in everything. We still have our roles, but we aren't adhering to them in a strict manner. We also communicate frequently regarding different steps in the project and when we are stuck on certain parts we consult eachother. This has worked well as having multiple eyes on the same code helps alleviate bugs and other issues much faster. We will likely continue this process for the upcoming final-related assignments.

# Devlog Entry (F1) - 12/8/24

## How does the user interface provide feedback to players on their available choices and the impacts of their choices? How can a first-time player quickly identify what they are trying to do and how to achieve it?
We had already started thinking about our UI since the beginning of the project, from little things to changing the grid color to match a farmland color scheme, all the way to adding tiny symbols in each cell to represent sun and water levels. We have different emojis and colors to represent each vegetable and its growth stage to make the game more intuitive for the player. When sun and water levels change after a crop is planted, the player can see how the sowed grid cell can change colors, as it can stay green or turn red from lack of water. Through these UI choices, our interface provides feedback to players on their available choices as well as their impacts. A first-time player can learn the game quickly and achieve their goals relatively soon or after a couple tries of playing the game. A negative aspect of the UI is that due to having a large grid,at times the symbols can become hard to see to the player. However this could be fixed by different color choices for text and by even changing the size of the grid cells. 

## How we satisfied the software requirements:
### F1.a
For this part, our goal was to implement our game's grid to be backed by a single contiguous byte array in either AoS or SoA format. We chose SoA (Structure-of-Arrays) format for this. 
    ![Structure-of-Arrays memory allocation strategy Diagram: ](./diagram.png)
### F1.b
For this part, our goal was that the player can manually save their progress in the game. They needed to be able to load the state and continue to play another day even after quitting the game application for example. The player must also be able to manage multiple save files/slots. To accomplish this we added save state logic to our game manager class. Allowing the player to save and load their progress is an important aspect of a game like this where the turns are based off the player and they can make as much progress as they would like in however much time they want. 
### F1.c
For this part, our goal was to implement an implicit auto-save system to support recovery from unexpected quits, such as when the game is launched, if an auto-save entry is present, the game may ask the player "do you want to continue where you left off?" We added more logic to our game manager class to accomplish this. We created an autosave function to handle saving the state automatically. Now, if a saved state is available, the game prompts the user if they would like to select it and play from there. 
### F1.d
For this part, our goal was that the player can undo every major choice (all the way back to the start of play) even from a saved game, as well as redo (undo of undo operations) multiple times. This step was incredibly difficult and took many hours to perfect. It was extremely finnicky getting the redo to work properly and this step took the longest of all of the steps so far. We created and added logic for this in our Action Manager class and used a stack to hold redo information. We also made sure to clear the stack when a new action is performed.

## Reflection:
Looking back on the F1 software requirements, our team's plan hasn't changed much surprisingly. We still continue to split tasks based on availability rather than adhere strictly to team roles. When we are stuck we consult eachother and take turns trying to solve difficult parts. We still delegate tasks based on team roles but this is not a finalized assignment of tasks as we often switch around and help eachother with any difficulties that arise. It took longer to complete F1 than F0 due to multiple difficulties that arose around getting the Undo and Redo options to work, and each step of F1 was more complex than the last, which made it take longer than anticipated to finish. In F0 we had already started focusing on different UI and visual elements to aid the player in understanding things like differences between the crops, and growth stages. So in F1 we already had a good start in terms of good UI for the player. We also included an instructions panel for the player to understand how to move around and plant different crops.

# Devlog Entry (F2) - 12/8/24

## How we satisfied the software requirements:
### F0 + F1
Our previous F0 and F1 requirements remain satisfied in the latest version of our software as we still have our basic gameplay mechanics, symbols/UI, gameplay progression, etc... No major changes were made.
### External DSL for Scenario Design
We decided to keep the scenario design located at the top of our main.ts file so the user would be able to easily edit the content and cater their gaming experience to their liking. We kept the DSL in Typescript, however it is still very welcoming to the user and allows for easy permutation.
Here is an example to our basic External DSL ![External DSL for game scenarios example: ](./External-DSL.png)
### Internal DSL for Plants and Growth Conditions
Internal DSL was written in TypeScript. We added several limiations on plant growth conditions. For example, Tomatos can only grow when surrounded by two other tomatos.
Here is a snippet of the code for plant growth conditions ![Internal DSL for plant growth example: ](./Internal-DSL.png)

In this code we see that tile.water and tile.sun are two of the more prevalent factors to plant growth. Sun is randomly decided between turns depending on game scenario. Whereas water either
slowly or rapidly accumulates depending on user chosen scenario. We also employed a helper function that assists in determining how many of a similar crop is neighboring (hasAdjacentPlantType()).
### Switch to Alternate Platform
For our switch to an alternate language/platform, we decided to switch from Typescript to Javascript. We chose to do this as we surmised that it would be the easiest/least complicated switch and wouldn't completely break what we currently have. However, switching to Javascript proved to be more difficult than we expected as we gained many errors we had to resolve in doing so. After some debugging it worked, and we assume it would've been harder still if we had chosen a different alternate platform.

## Reflection
Looking back on how we achieved the new F2 requirements, our team's plan hasn't changed much from when we completed F1 regarding our team roles. We did not reconsider any of the choices we previously described or Tools and Materials or our Roles as we kept them flexible since we completed F0. However, we had to decide on a new platform our language to emulate our project into. We decided to reimplement our project in Javascript which gave us complications that we are still working towards fixing. We learned through F2, that we need to remain even more flexible as we try new things and see what works and what doesn't, and that sometimes its better to come back to something later if you can't fix it right away.

# Devlog Entry (F3) - 12/9/24

## How we satisfied the software requirements:
### F0 + F1 + F2
No major changes were made.
### Internationalization
Our code has changed to distinguish between strings internal to the program and strings that will be shown to the player needing localization by creating a change-language function. When adding support for a new language/adding a new translatable message to the game we had to add this function which held logic to change the game's language to different languages such as spanish, arabic, and japanese. 
### Localization
The three other languages our game supports are arabic, japanese, and spanish. We accomplished localization for each language by having a subsection for each language in our change-language function that had translations of the instructions as well as other text in our game. We made use of translating apps such as Google Translate to translate our game into these different languages. The user can select which language to use by pressing on the drop down menu and selecting their desired language. Through this, the player can effectively change the language inside the game.
### Mobile Installation
To get our game installable on a mobile device, we made our existing webpage an installable Progressive Web App (PWA). To do this we had to create multiple new files such as manifest.json, sw.js, and edit our index.html. We followed detailed instructions online and were able to successfully deploy our web app on mobile. Following a PWA format made converting our game to a mobile platform mostly simple. We had to debug slightly but it proved to be less complex than we first imagined.
### Mobile Play (Offline)
To make our game play well on a mobile device we had to add buttons for all the controls and make the different text panels able to be hidden through toggle features since there's not enough space on a phone screen to display everything. Due to this it was necessary for us to be able to hide the various panels so the player could focus on the game. To make our game playable offline only a minor change was required in the sw.js file where we had to add the phaser.js to our urls-to-cache const so it was still accessible even offline. This was a unique change due to the fact that our game runs on github pages.

## Reflection
Looking back on how we achieved the F3 requirements, our team's plan, tools, materials, and roles stayed relatively similar to our plan from F2 as we completed these parts in a timeframe not too far apart from eachother. We remained flexible in our plan and consulted eachother when we were stuck. We delegated tasks and were able to meet our goals.