/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains the implementation of a Quadtree class and a Quadnode
 *  class used forspatial partitioning and spatial querying to speed up
 *  collision detection.
 *
 *  The Quadtree class holds the root node and some other Quadtree
 *  initialization logic and mostly just calls through to the root node.
 *
 *  The Quadnode class is responsible for most of the insert, remove and query
 *  logic of the Quadtree spatial partitioning method.
 *
 */


// ============================================================================
// Implementation of a Quadtree for sparial querying
function Quadtree() {
    this.init();
};

// ----------------------------------------------------------------------------
// Define methods for Quadtree class

// Function to initialize a quadtree
Quadtree.prototype.init = function () {
    // Set basic tree definiation variables
    this.box = new THREE.Box2( new THREE.Vector2( 0, 0 ), new THREE.Vector2( 1, 1 ) );
    this.depth = 4;

    // Initialize a buffer to hold any objects that don't fit in the tree
    this.data = new DynamicBuffer();

    // Call reset to build child nodes
    this.reset( [], 1, 1 );
}

// Function to clear all inserted data out of the tree recursively
Quadtree.prototype.clear = function () {
    this.root.clear();
}

// Function to insert and object into the quadtree
Quadtree.prototype.insert = function ( obj ) {
    // Attempt to insert the object
    if ( !this.root.insert( obj, obj.center() ) ) {
        // If we could not insert it just add it to the global object store
        this.data.push( obj );
    }
}

// Function to remove an object from the quadtree
Quadtree.prototype.remove = function ( obj ) {
    // Attempt to remove the object
    if ( !this.root.remove( obj, obj.center() ) ) {
        // If we could not remove it attempt to remove it from the global object store
        this.data.remove( obj );
    }
}

// Function to query the quadtree for objects that intersect in the given object
Quadtree.prototype.intersects = function ( obj, result ) {
    // Get/create buffer to store objects that intersect
    if ( !result )
        result = new DynamicBuffer();

    // Clear the buffer
    result.clear();

    // Test the object against all global objects
    var stored;
    for ( var i = 0; i < this.data.count; i++ ) {
        // Get the current stored object
        stored = this.data.data[ i ];

        // Check for intersection
        if ( obj !== stored ) {
            if ( obj.isIntersectionBox( stored ) || obj.containsBox( stored ) || stored.containsBox( obj ) )
                result.push( stored );
        }
    }

    // Look for intersections in valid child nodes
    this.root.intersects( obj, obj.center(), result );

    // Return the result set buffer
    return result;
}

// Function to reset the quadtree to its default state
Quadtree.prototype.reset = function ( objs, width, height ) {
    // Change the top-level box size
    this.box = new THREE.Box2( new THREE.Vector2( 0, 0 ), new THREE.Vector2( width, height ) );

    // Reset the top-level object buffer
    this.data = new DynamicBuffer();

    // Initialize root node
    this.root = new Quadnode( this.box, this.depth );

    // Insert all the objects
    for ( var i = 0; i < objs.length; i++ )
        this.insert( objs[ i ] );
}

// Function to render the spatial partitioning structure for visualization
Quadtree.prototype.render = function ( boxes ) {
    // Recursively render nodes and get a count of how many were rendered
    var used = this.root.render( boxes, 0 );

    // Blank out the rest of the nodes
    for ( var i = used; i < boxes.count; i++ )
        boxes.data[ i ].alpha = 0;
}


// ============================================================================
// Implementation of a Quadnode for sparial querying
function Quadnode( box, level ) {
    this.init( box, level );
};

// ----------------------------------------------------------------------------
// Define methods for Quadnode class

// Function to initialize a quadnode
Quadnode.prototype.init = function ( box, level ) {
    // Initialize node bounds
    this.box = box;
    this.center = box.center();
    this.level = level;

    // Create buffer to hold contained objects
    this.data = new DynamicBuffer();

    // Create lookup table for render color multiplier
    this.mult = [ 0, 0.18, 0.42, 0.75, 1, 1 ];

    // Initialize child nodes
    this.leaf = false;
    if ( this.level > 1 ) {
        var min = this.box.min;
        var max = this.box.max;
        var center = this.center;
        this.nw = new Quadnode( new THREE.Box2( new THREE.Vector2( min.x, min.y ), new THREE.Vector2( center.x, center.y ) ), this.level - 1 );
        this.ne = new Quadnode( new THREE.Box2( new THREE.Vector2( center.x, min.y ), new THREE.Vector2( max.x, center.y ) ), this.level - 1 );
        this.se = new Quadnode( new THREE.Box2( new THREE.Vector2( center.x, center.y ), new THREE.Vector2( max.x, max.y ) ), this.level - 1 );
        this.sw = new Quadnode( new THREE.Box2( new THREE.Vector2( min.x, center.y ), new THREE.Vector2( center.x, max.y ) ), this.level - 1 );
    } else
        this.leaf = true;
}

// Function to clear all inserted data out of the tree recursively
Quadnode.prototype.clear = function () {
    // Reset the object buffer
    this.data.clear();

    // Clear all children if there are any
    if ( !this.leaf ) {
        this.ne.clear();
        this.se.clear();
        this.sw.clear();
        this.nw.clear();
    }
}

// Function to insert an object into the node
Quadnode.prototype.insert = function ( obj, center ) {
    // Check if the object fits in this node
    if ( this.box.containsBox( obj ) ) {
        // Before we insert into this node, check if there is a valid child we can add to instead
        if ( !this.leaf ) {
            if ( center.y <= this.center.y ) {
                if ( center.x <= this.center.x ) {
                    if ( this.nw.insert( obj, center ) )
                        return true;
                } else {
                    if ( this.ne.insert( obj, center ) )
                        return true;
                }
            } else {
                if ( center.x <= this.center.x ) {
                    if ( this.sw.insert( obj, center ) )
                        return true;
                } else {
                    if ( this.se.insert( obj, center ) )
                        return true;
                }
            }
        }

        // If no valid child to insert into, add to this node
        this.data.push( obj );
        obj.alpha = ( 0.25 * this.level );
        return true;
    } else {
        // Return false if the object could not be inserted
        return false;
    }
}

// Function to remove an object from the node
Quadnode.prototype.remove = function ( obj, center ) {
    // Check if the object fits in this node
    if ( this.box.containsBox( obj ) ) {
        // Before we attempt to remove from this node, check if there is a valid child we remove from instead
        if ( !this.leaf ) {
            if ( center.y <= this.center.y ) {
                if ( center.x <= this.center.x ) {
                    if ( this.nw.remove( obj, center ) )
                        return true;
                } else {
                    if ( this.ne.remove( obj, center ) )
                        return true;
                }
            } else {
                if ( center.x <= this.center.x ) {
                    if ( this.sw.remove( obj, center ) )
                        return true;
                } else {
                    if ( this.se.remove( obj, center ) )
                        return true;
                }
            }
        }

        // If no valid child to remove from, remove from this node
        return this.data.remove( obj );
    } else {
        // Return false if the object could not be removed
        return false;
    }
}

// Function query a quadnode to determine if it has any objects intersecting the given object
Quadnode.prototype.intersects = function ( obj, center, result ) {
    // Check if this node overlaps with the object, if not, abort
    if ( !this.box.isIntersectionBox( obj ) && !this.box.containsBox( obj ) )
        return result;

    // Test the object against all objects in this node
    var stored;
    for ( var i = 0; i < this.data.count; i++ ) {
        // Get the current stored object
        stored = this.data.data[ i ];

        // Check for intersection
        if ( obj !== stored ) {
            if ( obj.isIntersectionBox( stored ) || obj.containsBox( stored ) || stored.containsBox( obj ) )
                result.push( stored );
        }
    }

    // Check all child nodes
    if ( !this.leaf ) {
        this.nw.intersects( obj, center, result );
        this.ne.intersects( obj, center, result );
        this.sw.intersects( obj, center, result );
        this.se.intersects( obj, center, result );
    }

    // Return the result set
    return result;
}

// Function to set up this node for rendering to visualize it
Quadnode.prototype.render = function ( boxes, index ) {
    // Attempt to render all child nodes if it has any
    if ( !this.leaf ) {
        index = this.nw.render( boxes, index );
        index = this.ne.render( boxes, index );
        index = this.se.render( boxes, index );
        index = this.sw.render( boxes, index );
    }

    // Only render this node if it has objects in it
    var m = this.mult[ this.level ];
    if ( this.data.count > 0 ) {
        boxes.data[ index ].alpha = 0.975;
        boxes.data[ index ].color.setRGB( 0.329 * m, 0.918 * m, 0.945 * m );
        boxes.data[ index ].set( this.box.min, this.box.max );
        index++;
    }

    // Return the current count of rendered boxes
    return index;
}