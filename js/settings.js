/*
 *  Author: Austin Steeno
 *  Email: austin.steeno@gmail.com
 *  Twitter: @EndainGaming
 *  ---------------------------------------------------------------------------
 *  This file contains the implementation of a Settings class used for giving
 *  the user a set of interactive slider controls to control various setting
 *  values. The Settings class binds to a settings object which describes the
 *  controls avaialable, providing a control names, starting value, minimum,
 *  maximum and step size.
 *
 */


// ============================================================================
// Class to handle binding a set of control settings to UI
function Settings( target, config ) {
    this.init( target, config );
};

// ----------------------------------------------------------------------------
// Define methods for Settings class

// Function to initialize the settings
Settings.prototype.init = function ( target, config ) {
    // Grab the target element
    this.target = $( target );

    // Store the config object
    this.config = config;

    // Parse all config options and create corresponding elements
    this.sliders = [];
    for ( var key in config )
        this.sliders.push( this.createSlider( config[ key ] ) );
}

// Function to create a slider object for the given settings
Settings.prototype.createSlider = function ( config ) {
    // Create a object to contain the slider
    var option = {
        data: config,
        decimals: decimalPlaces( config.increment ),
        clientX: 0
    };

    // Configure the handle width and track height
    var w = 16;
    var h = 8;

    // Create a container element
    option.container = $( document.createElement( 'div' ) );
    option.container.addClass( 'slider' );
    option.container.css( 'width', '100%' );
    option.container.css( 'margin', '0px 0px 1px 0px' );
    option.container.css( 'padding', '8px 0px 1px 0px' );
    option.container.css( 'border-bottom', '1px solid #eeeeee' );

    option.name = $( document.createElement( 'div' ) );
    option.name.addClass( 'name' );
    option.name.css( 'float', 'left' );
    option.name.css( 'font-weight', 'bold' );
    option.name.text( option.data.name );

    option.value = $( document.createElement( 'div' ) );
    option.value.addClass( 'value' );
    option.value.css( 'float', 'right' );
    option.value.css( 'font-weight', 'bold' );
    option.value.text( option.data.value );

    option.track = $( document.createElement( 'div' ) );
    option.track.addClass( 'track' );
    option.track.css( 'position', 'relative' );
    option.track.css( 'width', '100%' );
    option.track.css( 'height', h + 'px' );
    option.track.css( 'border-radius', '999px' );
    option.track.css( 'background-color', '#eeeeee' );

    option.progress = $( document.createElement( 'div' ) );
    option.progress.addClass( 'progress' );
    option.progress.css( 'position', 'absolute' );
    option.progress.css( 'width', '50%' );
    option.progress.css( 'height', h + 'px' );
    option.progress.css( 'border-radius', '999px' );
    option.progress.css( 'background-color', '#36a9e1' );
    option.progress.css( 'left', '0px' );
    option.progress.css( 'z-index', '10' );

    option.handle = $( document.createElement( 'div' ) );
    option.handle.addClass( 'handle' );
    option.handle.css( 'position', 'absolute' );
    option.handle.css( 'width', w + 'px' );
    option.handle.css( 'height', h + 'px' );
    option.handle.css( 'border-radius', '999px' );
    option.handle.css( 'border', '1px solid #36a9e1' );
    option.handle.css( 'margin-left', ( w / -2 ) + 'px' );
    option.handle.css( 'background-color', '#ffffff' );
    option.handle.css( 'left', '50%' );
    option.handle.css( 'z-index', '20' );

    option.min = $( document.createElement( 'div' ) );
    option.min.addClass( 'min' );
    option.min.css( 'float', 'left' );
    option.min.css( 'color', '#959595' );
    option.min.text( option.data.min );

    option.max = $( document.createElement( 'div' ) );
    option.max.addClass( 'max' );
    option.max.css( 'float', 'right' );
    option.max.css( 'color', '#959595' );
    option.max.text( option.data.max );

    // Add elements to DOM
    option.container.append( option.name );
    option.container.append( option.value );
    option.container.append( $( document.createElement( 'div' ) ).css( 'clear', 'both' ) );
    option.container.append( option.track );
    option.container.append( option.min );
    option.container.append( option.max );
    option.container.append( $( document.createElement( 'div' ) ).css( 'clear', 'both' ) );

    option.track.append( option.progress );
    option.track.append( option.handle );

    this.target.append( option.container );

    // Get a self reference for use in event handlers
    var self = this;

    // Initialize state to match with current value
    option.value.text( option.data.value );
    option.handle.css( 'left', valueToLeft( option.data.value ) + '%' );
    option.progress.css( 'width', valueToLeft( option.data.value ) + '%' );

    // Define event callback functions
    function handleMousemove( event ) {
        // Prevent normal events and propagation
        event.preventDefault();
        event.stopPropagation();

        // Find a proposed raw x offset
        var proposedX = option.baseX + ( event.clientX - option.clientX );

        // Convert the x offset to a valid option value
        var value = xToValue( proposedX );

        // Find the correct left offset percent from the value
        var left = valueToLeft( value );

        // Update elements
        option.value.text( value );
        option.handle.css( 'left', left + '%' );
        option.progress.css( 'width', left + '%' );

        // Commit the value
        option.data.value = parseFloat( value );
    }

    function handleMouseup( event ) {
        // Prevent normal events and propagation
        event.preventDefault();
        event.stopPropagation();

        // Unregister events
        $( document ).off( 'mousemove', handleMousemove );
        $( document ).off( 'mouseup', handleMouseup );

        // Emit event with updated value
        self.target[ 0 ].dispatchEvent( new CustomEvent( 'change', {
            'bubbles': true,
            'cancelable': true
        } ) );
    }

    // Set up handle event listeners
    option.handle.on( 'mousedown', function ( event ) {
        // Prevent highlighting
        event.preventDefault();

        // Prevent bubbling
        event.stopPropagation();

        // Set up for moving the bar
        option.baseX = option.handle.position().left;
        option.clientX = event.clientX;

        // Add event listeners to handle moving the slider
        $( document ).on( 'mousemove', handleMousemove );
        $( document ).on( 'mouseup', handleMouseup );
    } );

    // Set up track event listeners
    option.track.on( 'mousedown', function ( event ) {
        // Prevent highlighting
        event.preventDefault();

        // Set up for moving the bar
        option.baseX = event.offsetX;
        option.clientX = event.clientX;

        // Trigger handleMousemove once to immediately update slider value
        handleMousemove( event );

        // Add event listeners to handle moving the slider
        $( document ).on( 'mousemove', handleMousemove );
        $( document ).on( 'mouseup', handleMouseup );

    } );

    // Return the set up option
    return option;

    // Define some utility functions
    function xToValue( x ) {
        // Get the current width of the track
        var tw = option.track.width();

        // Bound the x to the valid track space
        var bx = bound( x, ( w / 2 ), tw - ( w / 2 ) ) - ( w / 2 );

        // Find to percent value in the usable range
        var percent = bx / ( tw - w );

        // Take this percent and scale it to a number using min/max
        var raw = option.data.min + ( percent * ( option.data.max - option.data.min ) );

        // Round and bound the number
        var val = bound( roundToIncrement( raw, option.data.increment, option.data.min ), option.data.min, option.data.max );
        return Number( val ).toFixed( option.decimals );
    }

    function valueToLeft( val ) {
        // Convert value to percent of option
        var percent = ( val - option.data.min ) / ( option.data.max - option.data.min );

        // Convert this percent to track percent
        var tw = option.track.width();
        var tx = ( w / 2 ) + ( ( tw - w ) * percent );

        return ( tx / tw ) * 100;
    }
}