slam-client
===========

Simultaneous Location and Mapping client in JavaScript


What is this?
-------------
Like it says above, it is meant to be a SLAM implementation in JavaScript.

How can I try it?
-----------------
[click here](http://bgard6977.github.io/slam-client)

Why JavaScript?
---------------
Well, I have a real Lego robot with [Lejos](http://www.lejos.org/) installed. It is a basic design that can drive, turn, and take range readings
with a IR range finder on a rotating mast. I have a Java server hosted in Tomcat that can relay commands to the robot over
bluetooth. So, the eventual goal is to turn this into a robot-as-a-service with three web methods:

1. double Drive(double distance)
2. double Turn(double radians)
3. double[] Scan()

When this server goes live, I want as much intelligence as possible to be in JavaScript, because:

1. It is easier to debug when the complex code is executing outside the robot
2. Step through debugging makes things simpler
3. I can mock out the robot, and test using deterministic settings that couldn't exist in the real world

But none of those are attributes solely possessed by JavaScript!
----------------------------------------------------------------
Well, yes but:

4. JavaScript is the new write-once, run anywhere language
5. It was really easy to put up this github page and not have to pay for hosting
6. Anyone will be able to fork this project and do what they want with it
7. Anyone can inspect the code right in their browser debug tools
8. It is really easy to share with people (I teach a robotics class, and students will love being able to drive the robot without having to install software)

And the final mitigating factor:
--------------------------------
Since the robot-as-a-service is just HTTP and JSON, anyone will be free to re-implement the SLAM-client part in the language of their choice.

Why is the code so messy?
-------------------------
Mostly because this is my 2nd attempt at SLAM, and SLAM seems pretty hard. I'm just throwing code together as fast
as possible to try the algorithmic concepts behind it. I don't normally code like this, and I'll clean it up as soon
as I'm sure the premise is sound.

Why don't you use more advanced algorithms?
-------------------------------------------
Well, because this is my 2nd attempt at SLAM. Call me slow, but it usually takes me three tries to get something right.
I hope next time I'll have this down. Also, I'm not an academic-type-person (although I'd like to be!). I spend most of my time at
my day job, and so robotics, machine learning, vector math, and all that fun stuff is just a hobby for now. (though if
you're hiring, I'm interested ;)

Why SLAM? Why not just localization? Or just mapping?
-----------------------------------------------------
I thought about just localization, but that would require me to input the map first, and since I don't see the world the
same way as an IR range finder does, I don't have faith that I'd enter it appropriately. Also, I want this to drive around
my office, and that's really big and it would take a long time to input. And it would change the next day.

Okay, but why not just mapping?
-------------------------------
Mostly because I have a (relatively) cheap Lego robot. It isn't very accurate in it's sensing or actuation. It cannot
possibly know it's location to a reasonable degree, so SLAM makes the most sense here. I am highly interested in
[this](http://diydrones.com/profiles/blogs/705844:BlogPost:29412) however, and I may try it in the future.

What's the design philosophy behind this?
-----------------------------------------
Goals:

1. Drop the real robot in the an arbitrary position in a room, and have it build a map on it's own.
2. Once the map is built (or possibly even during the mapping stage), allow the user to log in from their web browser, and drive the robot around.
3. Profit

Done:
* Find an arbitrary floorplan map, to use for simulation and testing
* Create a mock robot, that implements the same APIs that the real robot will eventually provide
* Begin with the mock (hidden) robot returning no error, and being observable to the client for testing
* Create many instances of "virtual robot" particles, guesses, or theories (what's the right term?)
* Use a pseudo-random number generator to create a reproducable test
* The test should include commands (actuation) and results (sensing data)
* The hidden robot is the only one that can observe the "real" map
* The same set of commands should be sent to both the hidden robot, and all the virtual robots
* The hidden robot will execute the command (with realistic error) and return sensor results (with realistic error)
* The virtual robots will execute the same command, and return the same results (with their own random error)
* The SLAM "client" code will compare the "real" results with the virtual results, and assign a fitness value to each virtual robot
* Genetic algorithm techniques will be applied to remove the least fit virtual bots, and breed the most fit robots

TODO:
* Improve the fitness function - don't just check the distance value, turn it into a probability distribution function and compare that with the results of a cast ray on the belief map
* Improve the selection function - right now it is following the probabilistic model, which judges based on standard deviation of fitness, and breeds based on normal distribution of position. It might be better to use an algorithm more closely inspired by natural selection. The current method never seems to get really accurate (or really inaccurate) - it mostly hovers around a 16 pixel spread.
* Increase the error until the simulation can deal with greater error than will be encountered in real life
* Wait until really awesome results are observed: linear distributions along 1d edges, point distribution near 2d corners, gaussian distributions in open space, collapsing near landmarks, expanding in the open
* Test to see if the map-per-robot paradigm can be replaced with one shared map, where samples are applied based on the mean position (freeing up tons of memory)
* Implement turn, drive, scan UI for manual exploration
* Implement a click-to-drive UI with no path finding
* Implement collision detection
* Add path finding to point-and-click UI to avoid obstacles
* Create a least-cost highest-knowledge-gain exploration algorithm
* When the virtual robot is performing all these functions well, perform private testing with the real robot
* Add security features (one user at a time) to the real robot proxy server
* Open the API to the public

Well, that all makes sense, how can I help?
-------------------------------------------
Just an encouraging note would be awesome! If you are experienced in probablistic robotics, then please take a
look at the code and give me some advice! Currently my sticking points are:

* What does an ideal fitness function look like?
* What should my selection (and breeding) functions look like?
* Am I going about things the right way?
* Is this a sane project?
* Will I reach my goals following the project plan listed above?
* Are there any unknown roadblocks I should expect to encounter?
* Do most SLAM algorithms use a map-per-robot? Can I get away with a shared map?
* Do rasterized maps make sense? or do most people do this in continuous space? (i.e. point cloud?)
* Does the genetic algorithm approach make sense?
* Is killing "bad" particles enough? Should I worry about re-writing history when new data is found? (i.e. running the simulation from the begining with the new data?)

This sounds fun, how do I get into probablistic robotics?
---------------------------------------------------------
Read [this book](http://www.amazon.com/Probabilistic-Robotics-Intelligent-Autonomous-Agents/dp/0262201623).

