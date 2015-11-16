/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file is the main program for the spatial partitioning article. It is
 *  responsible for setting up all demos and simulations, binding them to the
 *  correct DOM elements and them driving the simluation animation.
 *
 */


// Get demo elements
var exBasic = document.getElementById( 'ex-basic' );
var exQuadtree = document.getElementById( 'ex-quadtree' );
var exGrid = document.getElementById( 'ex-grid' );
var exHashing = document.getElementById( 'ex-hashing' );

// Set up interactive demos
var demoBasic = new Demo( exBasic, new Simulation( exBasic, Basic ) );
var demoQuadtree = new Demo( exQuadtree, new Simulation( exQuadtree, Quadtree ) );
var demoGrid = new Demo( exGrid, new Simulation( exGrid, Grid ) );
var demoHashing = new Demo( exHashing, new Simulation( exHashing, SpatialHash ) );

// Start up animation loop
function animate() {
	demoBasic.render();
	demoQuadtree.render();
	demoGrid.render();
	demoHashing.render();

	requestAnimationFrame( animate );
}

animate();