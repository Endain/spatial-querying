/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains the implementations of a Demo class and a BoxSet class
 *  used for running interactive collision detection demos.
 *
 *  This Demo class is responsible for setting up the canvas to render to and
 *  handling setting up the simulation and responding to various events such as
 *  resizing the browser window or pausing the demo when the cursor is not over
 *  the demo region.
 *
 *  The BoxSet class is a geometry buffer class for rendering large sets of
 *  colored boxes and lines efficiently using THREE.js and WebGL.
 *
 */


// ============================================================================
// Class to handle running a web-gl based demo
function Demo( target, simulation ) {
    this.init( target, simulation );
};

// ----------------------------------------------------------------------------
// Define methods for Demo class

// Function to initialize the demo to the target element
Demo.prototype.init = function ( target, simulation ) {
    // Grab the target element
    this.target = $( target );

    // Keep a handle on the simulation
    this.simulation = simulation;

    // Validate target and simulation
    if ( this.target && this.simulation ) {
        // Get the config from the simulation
        this.config = this.simulation.getConfig();

        // Create other elements for running demo
        this.canvas = $( document.createElement( 'canvas' ) );
        this.cover = $( document.createElement( 'div' ) );

        // Set up elements
        this.target.css( 'position', 'relative' );

        this.cover.addClass( 'demo-cover' );
        this.cover.css( 'position', 'absolute' );
        this.cover.css( 'left', '0px' );
        this.cover.css( 'top', '0px' );
        this.cover.css( 'width', '100%' );
        this.cover.css( 'height', '100%' );
        this.cover.css( 'z-index', '100' );
        this.cover.text( 'Hover To Activate Demo' );

        this.canvas.css( 'position', 'absolute' );
        this.canvas.css( 'left', '0px' );
        this.canvas.css( 'top', '0px' );
        this.canvas.css( 'width', '100%' );
        this.canvas.css( 'height', '100%' );
        this.canvas.css( 'z-index', '0' );

        // Add elements
        this.target.append( this.canvas );
        this.target.append( this.cover );

        // Set up self reference for event callback
        var self = this;

        // Set up event listener for hover
        this.target.on( 'mouseenter', function () {
            // Hide cover
            self.cover.css( 'display', 'none' );

            // Unpause demo
            self.paused = false;
        } );

        this.target.on( 'mouseleave', function () {
            // Hide cover
            self.cover.css( 'display', 'block' );

            // Pause demo
            self.paused = true;
        } );

        // Set up listener for config change
        this.target.on( 'change', function ( event ) {
            // Stop event propagation
            event.stopPropagation();

            // Trigger a simulation reset
            self.reset();
        } );

        // Set up event listener for demo area resizing
        $( window ).on( 'resize', function () {
            // Trigger demo resize and possibly reset
            self.resize();
        } );

        // Set up event listener for mouse movement on the canvas
        this.canvas.on( 'mousemove', function ( event ) {
            // Update the simulation selection position
            self.simulation.setSelectionPosition( event.offsetX, event.offsetY );
        } );

        // Trigger initial resize/reset
        this.resize();

        // Pause demo immediately
        this.paused = true;
    }
}

// Function to resize the demo and trigger a reset if the size changed
Demo.prototype.resize = function () {
    // Check if target size has changed or not
    if ( this.width !== this.target.width() || this.height !== this.target.height() ) {
        // Get the target element size
        this.width = this.target.width();
        this.height = this.target.height();

        // Set the canvas size
        this.canvas.css( 'width', this.width + 'px' );
        this.canvas.css( 'height', this.height + 'px' );

        // Reset the demo
        this.reset();
    }
}

// Function the reset the demo, recreating all the rendering contexts and reseting the simulation
Demo.prototype.reset = function () {
    // Prepare renderer
    this.renderer = new THREE.WebGLRenderer( {
        antialias: true,
        canvas: this.canvas[ 0 ]
    } );
    this.renderer.setSize( this.width, this.height );
    this.renderer.setClearColor( 0x161616 );

    // Prepare camera for rendering
    this.camera = new THREE.OrthographicCamera( 0, this.width, 0, this.height, -100, 100 );

    // Set up partition, object and query box sets
    this.partitions = new BoxSet( 1000 );
    this.objects = new BoxSet( this.config.boxes.value );
    this.query = new BoxSet( 1 );

    // Trigger simulation reset
    if ( this.simulation )
        this.simulation.reset( this.width, this.height, this.partitions.boxes, this.objects.boxes, this.query.boxes );

    // Render once immediately
    this.render();
}

Demo.prototype.render = function () {
    // Skip rendering if paused
    if ( this.paused )
        return;

    // Trigger simulation step
    var details = null;
    if ( this.simulation )
        details = this.simulation.step();

    // Update all box sets
    this.partitions.render();
    this.objects.render();
    this.query.render();

    // Render all the scenes
    this.renderer.autoClear = true;
    this.renderer.render( this.partitions.scene, this.camera );
    this.renderer.autoClear = false;
    this.renderer.render( this.objects.scene, this.camera );
    this.renderer.autoClear = false;
    this.renderer.render( this.query.scene, this.camera );
}


// ============================================================================
// Implementation of a BoxSet for rendering a set of boxes
function BoxSet( size ) {
    this.init( size );
};

// ----------------------------------------------------------------------------
// Define methods for BoxSet class

// Function to initialize box set and set up rendering and data buffers
BoxSet.prototype.init = function ( size ) {
    // Store max size
    this.size = size;

    // Set up scene to render
    this.scene = new THREE.Scene();

    // Set up geomety buffers
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array( this.size * 3 * 8 );
    this.colors = new Float32Array( this.size * 4 * 8 );
    this.geometry.addAttribute( 'position', new THREE.BufferAttribute( this.positions, 3 ).setDynamic( true ) );
    this.geometry.addAttribute( 'color', new THREE.BufferAttribute( this.colors, 4 ).setDynamic( true ) );
    this.geometry.groups.push( {
        start: 0,
        count: 0,
        index: 0
    } );

    // Set up material
    this.material = new THREE.ShaderMaterial( {
        vertexShader: document.getElementById( 'vs-line' ).textContent,
        fragmentShader: document.getElementById( 'fs-line' ).textContent,
        blending: THREE.NormalBlending,
        depthTest: false,
        transparent: true
    } );

    // Set up mesh to render
    this.lines = new THREE.LineSegments( this.geometry, this.material );

    // Add the mesh to the scene
    this.scene.add( this.lines );

    // Set up dynamic buffer for boxes
    this.boxes = new DynamicBuffer( this.size );

    // Create boxes
    var box;
    for ( var i = 0; i < this.size; i++ ) {
        // Use Box2 as our base box class and add color and other attributes
        box = new THREE.Box2( new THREE.Vector2( -2, -2 ), new THREE.Vector2( -1, -1 ) );
        box.color = new THREE.Color( 0xffffff );
        this.boxes.push( box );
    }
}

// Function to access the box array directly
BoxSet.prototype.getRawBoxes = function () {
    return this.boxes.data;
}

// Function to prepare the boxes for being rendered by update geomtry buffers
BoxSet.prototype.render = function () {
    // Only process the boxes in the buffer
    var box, color, alpha;
    for ( var i = 0; i < this.boxes.count; i++ ) {
        // Get the current box
        box = this.boxes.data[ i ];

        // Update positions
        this.positions[ i * 24 + 0 ] = box.min.x;
        this.positions[ i * 24 + 1 ] = box.min.y;
        this.positions[ i * 24 + 2 ] = 0;
        this.positions[ i * 24 + 3 ] = box.max.x;
        this.positions[ i * 24 + 4 ] = box.min.y;
        this.positions[ i * 24 + 5 ] = 0;

        this.positions[ i * 24 + 6 ] = box.max.x;
        this.positions[ i * 24 + 7 ] = box.min.y;
        this.positions[ i * 24 + 8 ] = 0;
        this.positions[ i * 24 + 9 ] = box.max.x;
        this.positions[ i * 24 + 10 ] = box.max.y;
        this.positions[ i * 24 + 11 ] = 0;

        this.positions[ i * 24 + 12 ] = box.max.x;
        this.positions[ i * 24 + 13 ] = box.max.y;
        this.positions[ i * 24 + 14 ] = 0;
        this.positions[ i * 24 + 15 ] = box.min.x;
        this.positions[ i * 24 + 16 ] = box.max.y;
        this.positions[ i * 24 + 17 ] = 0;

        this.positions[ i * 24 + 18 ] = box.min.x;
        this.positions[ i * 24 + 19 ] = box.max.y;
        this.positions[ i * 24 + 20 ] = 0;
        this.positions[ i * 24 + 21 ] = box.min.x;
        this.positions[ i * 24 + 22 ] = box.min.y;
        this.positions[ i * 24 + 23 ] = 0;

        // Get the current color
        color = box.color;

        // Compute alpha
        alpha = box.alpha !== undefined ? box.alpha : 1;

        // Update colors
        this.colors[ i * 32 + 0 ] = color.r;
        this.colors[ i * 32 + 1 ] = color.g;
        this.colors[ i * 32 + 2 ] = color.b;
        this.colors[ i * 32 + 3 ] = alpha;
        this.colors[ i * 32 + 4 ] = color.r;
        this.colors[ i * 32 + 5 ] = color.g;
        this.colors[ i * 32 + 6 ] = color.b;
        this.colors[ i * 32 + 7 ] = alpha;

        this.colors[ i * 32 + 8 ] = color.r;
        this.colors[ i * 32 + 9 ] = color.g;
        this.colors[ i * 32 + 10 ] = color.b;
        this.colors[ i * 32 + 11 ] = alpha;
        this.colors[ i * 32 + 12 ] = color.r;
        this.colors[ i * 32 + 13 ] = color.g;
        this.colors[ i * 32 + 14 ] = color.b;
        this.colors[ i * 32 + 15 ] = alpha;

        this.colors[ i * 32 + 16 ] = color.r;
        this.colors[ i * 32 + 17 ] = color.g;
        this.colors[ i * 32 + 18 ] = color.b;
        this.colors[ i * 32 + 19 ] = alpha;
        this.colors[ i * 32 + 20 ] = color.r;
        this.colors[ i * 32 + 21 ] = color.g;
        this.colors[ i * 32 + 22 ] = color.b;
        this.colors[ i * 32 + 23 ] = alpha;

        this.colors[ i * 32 + 24 ] = color.r;
        this.colors[ i * 32 + 25 ] = color.g;
        this.colors[ i * 32 + 26 ] = color.b;
        this.colors[ i * 32 + 27 ] = alpha;
        this.colors[ i * 32 + 28 ] = color.r;
        this.colors[ i * 32 + 29 ] = color.g;
        this.colors[ i * 32 + 30 ] = color.b;
        this.colors[ i * 32 + 31 ] = alpha;
    }

    // Configure draw call batching
    this.geometry.groups[ 0 ].count = this.boxes.count * 8;

    // Update the line geometry for rendering
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
}