// Simple three.js example

var mesh, renderer, scene, camera, controls;

const DIM = {
    XFRONT: 0,
    XBACK: 1,
    CEILING: 2,
    FLOOR: 3,
    ZFRONT: 4,
    ZBACK: 5
}

const prefix = 'textures/';
const TEXTURES = {
    ACOUSTIC: prefix + 'acoustic_ceiling.jpg',
    BARE_BRICK: prefix + 'bare_brick.jpg',
    CONCRETE: prefix + 'concrete.jpg',
    CONCRETE2: prefix + 'concrete2.jpg',
    GRASS: prefix + 'grasslight-big.jpg',
    HARDWOOD: prefix + 'hardwood2_diffuse.jpg',
    MARBLE: prefix + 'marble.jpg',
    METAL: prefix + 'metal.jpg',
    PAINTED_BRICK: prefix + 'painted_brick.jpg',
    PARQUET: prefix + 'parquet.jpg',
    PLASTER: prefix + 'plaster_smooth.jpg',
    WOOD: prefix + 'hardwood2_diffuse.jpg',
    PLYWOOD: prefix + 'plywood.jpg',
    POLISHED_CONCRETE: prefix + 'polished_concrete1.jpg',
    SHEETROCK: prefix + 'sheetrock.jpg'
}

init();
animate();

function init() {

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x889988 );
    document.body.appendChild( renderer.domElement );

    // scene
    scene = new THREE.Scene();

    var axesHelper = new THREE.AxesHelper( 1 );
    scene.add( axesHelper );
    
    // camera
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 4, 4, 4 );
    scene.add( camera ); // required, since adding light as child of camera

    // controls
    controls = new THREE.OrbitControls( camera );
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2;
    
    // ambient
    scene.add( new THREE.AmbientLight( 0xf2f2f2 ) );
    
    // light
    // var light = new THREE.PointLight( 0xffffff, 0.8 );
    // light.position.y = -0.5;
    // scene.add( light );

    // axes
    //scene.add( new THREE.AxisHelper( 20 ) );

    // geometry
    var geometry = new THREE.BoxBufferGeometry( 0.8, 0.4, 0.4 );
    
    // // material
    // var material1 = new THREE.MeshPhongMaterial( {
    //     color: 'sandybrown'
    // } );
    
    // // mesh
    // mesh = new THREE.Mesh( geometry, material1 );
    // mesh.position.set( 0.4, -0.8, 1.2 );
    // scene.add( mesh );

    // // geometry
    // var geometry = new THREE.BoxGeometry( 0.4, 0.4, 0.4 );
    
    // // material
    // var material1 = new THREE.MeshPhongMaterial( {
    //     color: 'gray'
    // } );
    
    // // mesh
    // mesh = new THREE.Mesh( geometry, material1 );
    // mesh.position.set( -0.4 , -0.8, -1.2 );
    // scene.add( mesh );

    // geometry
    var geometry = new THREE.BoxGeometry( 4, 2, 4 );
    // geometry.computeVertexNormals();
    // geometry.computeBoundingBox();

    // material
    var material1 = new THREE.MeshPhongMaterial( {
        color: 0xffffff, 
        transparent: true,
        opacity: .1
    } );
    
    // mesh
    mesh = new THREE.Mesh( geometry, material1 );
    scene.add( mesh );
    
    // material
    // var material2 = new THREE.MeshPhongMaterial( {
    //     color: 0xffffff, 
    //     transparent: false,
    //     side: THREE.BackSide
    // } );

    var xFront = new THREE.MeshPhongMaterial({side: THREE.BackSide}),
        xBack = new THREE.MeshPhongMaterial({side: THREE.BackSide}),
        ceiling = new THREE.MeshPhongMaterial({side: THREE.BackSide}),
        floor = new THREE.MeshPhongMaterial({side: THREE.BackSide}),
        zFront = new THREE.MeshPhongMaterial({side: THREE.BackSide}),
        zBack = new THREE.MeshPhongMaterial({side: THREE.BackSide});
    
    // order to add materials: x+,x-,y+,y-,z+,z-
    var material2 = [
        xFront,
        xBack,
        ceiling,
        floor,
        zFront,
        zBack
    ];

    var textureLoader = new THREE.TextureLoader();
    var wood = textureLoader.load(TEXTURES.WOOD);
    var brick = textureLoader.load(TEXTURES.BARE_BRICK);
    var acoustic = textureLoader.load(TEXTURES.ACOUSTIC);
    material2[DIM.FLOOR].map = wood;
    material2[DIM.XFRONT].map = acoustic;
    material2[DIM.XBACK].map = acoustic;
    material2[DIM.ZFRONT].map = acoustic;
    material2[DIM.ZBACK].map = acoustic;
    material2[DIM.CEILING].map = acoustic;
    setTexture([wood, acoustic]);

    // mesh
    mesh = new THREE.Mesh( geometry, material2 );
    scene.add( mesh );

    var prwmLoader = new THREE.PRWMLoader();
    var listenerUrl = 'models/smooth-suzanne.*.prwm';
    var material = new THREE.MeshPhongMaterial({color: 'brown'});
    loadModel(prwmLoader, listenerUrl, material, scene);

    var tdsLoader = new THREE.TDSLoader();
    var objectUrl = 'models/Parlante_3_5P_4_Ohms.3ds';
    // var material = new THREE.MeshPhongMaterial({});
    tdsLoader.load(objectUrl, function(object) {
        object.scale.set(.005, .005, .005);
        object.position.set(-0.8, 0.2, 0.5);
        scene.add(object);
        var axes = new THREE.AxesHelper( 100 );
        object.add(axes);
    });
}

function loadModel(loader, url, material, scene) {
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
            if ( xhr.loaded === xhr.total ) {
                console.log( 'File size: ' + ( xhr.total / 1024 ).toFixed( 2 ) + 'kB' );
            }
        }
    };
    
    var onError = function () {
        console.log(url + ' error loading');
    };

    loader.load(url, function(geometry) {
        mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(.2, .2, .2);
        mesh.position.set(.5, -.5, -.5);
        scene.add(mesh);
        var axes = new THREE.AxesHelper( 2 );
        mesh.add(axes);
    }, onProgress, onError);
}


function setTexture(textures) {
    textures.forEach(texture => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 4, 4 );
    });
}

function animate() {

    requestAnimationFrame( animate );
    
    //controls.update();

    renderer.render( scene, camera );

}
