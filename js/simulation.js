/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains the implementation of a Simulation class used for
 *  running a simulation based on a set of settings where many boxes bounce
 *  around in some region of space and will detect collisions with one another
 *  and with a user-controlled selection box.
 *
 */


// =====================================================================
// Class to handle running a simple collision simulation
function Simulation( target, method ) {
    this.init( target, method );
};

// ---------------------------------------------------------------------
// Define methods for Simulation class

// Function to initialize the simulation
Simulation.prototype.init = function ( target, method ) {
    // Grab the target element
    this.target = $( target );

    // Store the partitioning method
    this.method = method;

    // Make a new space partition
    this.partition = new this.method();

    // Track the mouse position on this simulation
    this.x = 0;
    this.y = 0;

    // Generate initial configuration
    this.config = this._generateConfig();

    // Set up control UI
    this.control = $( document.createElement( 'div' ) );
    this.container = $( document.createElement( 'div' ) );

    // Set up elements
    this.target.css( 'position', 'relative' );

    this.control.addClass( 'simulation-control' );
    this.control.css( 'position', 'absolute' );
    this.control.css( 'right', '8px' );
    this.control.css( 'top', '8px' );
    this.control.css( 'width', '24px' );
    this.control.css( 'height', '24px' );
    this.control.css( 'overflow', 'hidden' );
    this.control.css( 'z-index', '50' );

    this.container.addClass( 'container' );
    this.container.css( 'position', 'absolute' );
    this.container.css( 'right', '0px' );
    this.container.css( 'top', '0px' );
    this.container.css( 'width', '252px' );
    this.container.css( 'opacity', '0' );


    // Add elements
    this.target.append( this.control );
    this.control.append( this.container );

    // Set up self reference for event callback
    var self = this;

    // Set up event listener for hover
    this.control.on( 'mouseenter', function () {
        // Resize settings window
        self.control.css( 'width', '256px' );
        self.control.css( 'height', self.container.height() + 'px' );

        // Show settings window content
        self.container.css( 'opacity', '1' );
    } );

    this.control.on( 'mouseleave', function () {
        // Resize settings window
        self.control.css( 'width', '24px' );
        self.control.css( 'height', '24px' );

        // Show settings window content
        self.container.css( 'opacity', '0' );
    } );

    // Create a settings controller
    var settings = new Settings( this.container, this.config );

    // Create a performance controller
    this.performance = new Performance( this.target );
}

// Function to reset the simulation
Simulation.prototype.reset = function ( w, h, partitions, boxes, selection ) {
    // Store the current configuration
    this.world = new THREE.Box2( new THREE.Vector2( 0, 0 ), new THREE.Vector2( w, h ) );
    this.partitions = partitions;
    this.boxes = boxes;
    this.selection = selection;

    // Keep a utility vector in memory
    this.vec = new THREE.Vector2( 0, 0 );

    // Randomize the existing boxes
    var x, y, large, s, vx, vy;
    var boxes = this.boxes.data;
    for ( var i = 0; i < this.boxes.count; i++ ) {
        large = ( i < ( this.config.distribution.value / 100 ) * this.config.boxes.value );
        s = large ? ( Math.random() * 45 + 35 ) : ( Math.random() * 16 + 4 );

        x = ( s / 2 ) + Math.random() * ( w - s );
        y = ( s / 2 ) + Math.random() * ( h - s );

        vx = Math.random() * 2 - 1;
        vy = Math.random() * 2 - 1;

        boxes[ i ].setFromCenterAndSize( new THREE.Vector2( x, y ), new THREE.Vector2( s, s ) );
        boxes[ i ].vel = new THREE.Vector2( vx, vy );
    }

    // Shuffle the array
    shuffle( boxes, this.boxes.count );

    // Pick random boxes to be dynamic
    for ( var i = 0; i < this.boxes.count; i++ )
        boxes[ i ].dynamic = ( i < ( this.config.dynamic.value / 100 ) * this.config.boxes.value );

    // Reset the user selection box
    this.center = new THREE.Vector2( this.x, this.y );
    this.size = new THREE.Vector2( this.config.selection.value, this.config.selection.value );
    this.selection.data[ 0 ].setFromCenterAndSize( this.center, this.size );

    // Reset the space partition
    this.partition.reset( this.boxes.data, w, h );

    // Create a result buffer for use in spatial queries
    this.result = new DynamicBuffer( this.boxes.count );
}

// Function to set the selection box's position
Simulation.prototype.setSelectionPosition = function ( x, y ) {
    this.x = x;
    this.y = y;
}

// Function to progress the simulation
Simulation.prototype.step = function () {
    // Declare some temp variables
    var box, result, start;

    // Time this step
    start = performance.now();


    // Move all boxes, reset box colors, update place in spartial partitioning
    for ( var i = 0; i < this.boxes.count; i++ ) {
        // Get the current box
        box = this.boxes.data[ i ];

        // Reset color
        box.color.setRGB( 0.925, 0.925, 0.925 );

        // Skip if not dynamic
        if ( !box.dynamic )
            continue;

        // Remove from spatial partition
        this.partition.remove( box );

        // Move the box
        box.translate( box.vel );

        // Keep box in bounds
        if ( box.min.x < this.world.min.x ) {
            this.vec.x = ( this.world.min.x - box.min.x ) * 2;
            this.vec.y = 0;
            box.translate( this.vec );
            box.vel.x *= -1;
        } else if ( box.max.x > this.world.max.x ) {
            this.vec.x = ( this.world.max.x - box.max.x ) * 2;
            this.vec.y = 0;
            box.translate( this.vec );
            box.vel.x *= -1;
        }

        if ( box.min.y < this.world.min.y ) {
            this.vec.x = 0;
            this.vec.y = ( this.world.min.y - box.min.y ) * 2;
            box.translate( this.vec );
            box.vel.y *= -1;
        } else if ( box.max.y > this.world.max.y ) {
            this.vec.x = 0;
            this.vec.y = ( this.world.max.y - box.max.y ) * 2;
            box.translate( this.vec );
            box.vel.y *= -1;
        }

        // Re-insert into spatial partition
        this.partition.insert( box );
    }

    // Find all boxes the box overlaps (intersects, contains or is contained in)
    for ( var i = 0; i < this.boxes.count; i++ ) {
        // Get the current box
        box = this.boxes.data[ i ];

        // Find all boxes is overlaps with
        result = this.partition.intersects( box, this.result );

        // If the box overlaped, mark the box
        if ( result.count > 0 )
            box.color.setRGB( 1.000, 0.360, 0.345 );
    }

    // Update user selection box
    this.center.x = this.x;
    this.center.y = this.y;
    this.selection.data[ 0 ].setFromCenterAndSize( this.center, this.size );
    this.selection.data[ 0 ].color.setRGB( 0.333, 0.969, 0.376 );
    this.selection.data[ 0 ].alpha = 1;

    // Find all boxes the box overlap the selection box (intersects, contains or is contained in)
    box = this.selection.data[ 0 ];

    // Find all boxes is overlaps with
    result = this.partition.intersects( box, this.result );

    // If the box overlaped, mark the box
    for ( var i = 0; i < result.count; i++ )
        result.data[ i ].color.setRGB( 0.710, 1.000, 0.739 );


    // Finish timing
    this.performance.push( performance.now() - start );

    // Update all patition boxes
    this.partition.render( this.partitions );
}

// Function to get the simulation config
Simulation.prototype.getConfig = function () {
    return this.config;
}

// Function to generate default configuration
Simulation.prototype._generateConfig = function () {
    return {
        'boxes': {
            'name': 'Number of Boxes',
            'min': 50,
            'max': 2750,
            'increment': 50,
            'value': 300
        },
        'dynamic': {
            'name': 'Percent Dynamic Boxes',
            'min': 0,
            'max': 100,
            'increment': 1,
            'value': 50
        },
        'distribution': {
            'name': 'Percent Large Boxes',
            'min': 0,
            'max': 20,
            'increment': 0.5,
            'value': 5.0
        },
        'selection': {
            'name': 'Selection Box Size',
            'min': 10,
            'max': 400,
            'increment': 10,
            'value': 30
        }
    };
}