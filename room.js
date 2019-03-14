// Simple three.js example

var mesh, renderer, scene, camera, controls;
let room, roomOuter, listener, soundSource;

let audioContext;
let audioElement, audioElementSource, audioBufferSource;
let source;
let audioScene;
let mat;
let dimensions = {
    width: 4, height: 4, depth: 4
};
let materials = {
    left: 'uniform', right: 'uniform',
    front: 'uniform', back: 'uniform',
    up: 'uniform', down: 'uniform'
};
let listenerPos = {
    x: 0,
    y: 0,
    z: 0
};
let sourcePos = {
    x: 1.5,
    y: 1,
    z: 0
};

const DIM = {
    RIGHT: 0,
    LEFT: 1,
    UP: 2,
    DOWN: 3,
    BACK: 4,
    FRONT: 5
};
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
    PLYWOOD: prefix + 'plywood.png',
    POLISHED_CONCRETE: prefix + 'polished_concrete1.jpg',
    SHEETROCK: prefix + 'sheetrock.jpg',
    CURTAIN: prefix + 'curtain.jpg',
    FIBERGLASS: prefix + 'fiberglass_insulation.png',
    WATER: prefix + 'water.jpg',
    UNIFORM: prefix + 'acoustic_ceiling_one.jpg',
    GLASS_THICK: prefix + 'glass_thick.jpg'
};
let prev;

init();
animate();

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext);
    audioScene = new ResonanceAudio(audioContext, {
        ambisonicOrder: 1,
        dimensions: dimensions,
        materials: materials
    });
    source = audioScene.createSource();
    audioBufferSource = audioContext.createBufferSource();
    audioBufferSource.connect(source.input);
    audioScene.output.connect(audioContext.destination);
    audioScene.output.channelCount = 4;
    audioScene.output.channelCountMode = 'max';
    console.log(audioScene.output.channelCount);
    // audioContext.destination.channelCount = 4;
    audioScene.setListenerPosition(listenerPos.x,
        listenerPos.y,
        listenerPos.z);
    source.setPosition(sourcePos.x,
        sourcePos.y,
        sourcePos.z);

    var request = new XMLHttpRequest();
    request.open('GET', 'audio/music.wav', true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        var audioData = request.response;

        audioContext.decodeAudioData(audioData, function(buffer) {
            audioBufferSource.buffer = buffer;
            audioBufferSource.loop = true;
        }, function(e) {
            console.log("error decoding!");
        })
    }
    request.send();
}

function init() {
    setupScene();
    setupRoom();
    setupListerner();
    setupSource();
    setupControls();
    initAudio();
}

function setupControls() {
    var playing = false, firstTime = true;

    var FizzyText = function() {
        this.width = dimensions.width;
        this.height = dimensions.height;
        this.depth = dimensions.depth;
        this.material = 'uniform';
        this.play = function() {
            if (!playing) {
                if (firstTime) {
                    audioBufferSource.start();
                    firstTime = false;
                }
                audioScene.output.connect(audioContext.destination);
                playing = true;
            } else {
                audioScene.output.disconnect();
                playing = false;
            }
            
        };
        this.range = Math.sqrt(sourcePos.x * sourcePos.x +
            sourcePos.y * sourcePos.y +
            sourcePos.z * sourcePos.z);
        this.azimuth = Math.atan(sourcePos.y/sourcePos.x);
        this.elevation = Math.acos(sourcePos.z/this.range);
        this.sourceX = sourcePos.x;
        this.sourceY = sourcePos.y;
        this.sourceZ = sourcePos.z;
        // this.sourceRX = 0;
        // this.sourceRY = 0;
        // this.sourceRZ = 0;
        this.listenerX = listenerPos.x;
        this.listenerY = listenerPos.y;
        this.listenerZ = listenerPos.z;
        this.listenerRX = 0;
        this.listenerRY = 0;
        this.listenerRZ = 0;
        this.left = materials.left,
        this.right = materials.right,
        this.up = materials.up,
        this.down = materials.down,
        this.front = materials.front,
        this.back = materials.back
    };

    var text = new FizzyText();
    var gui = new dat.GUI({autoplace: false, width: 300});
    gui.remember(text);

    // source 
    var srcPos = gui.addFolder('Source Position(Spherical)');
    var range = srcPos.add(text, 'range', 
        0, Math.min(dimensions.width, dimensions.height, dimensions.depth)*2/5).step(0.01).listen();
    var azimuth = srcPos.add(text, 'azimuth',
        0, 2*Math.PI).step(0.01).listen();
    var elevation = srcPos.add(text, 'elevation',
        0, 2*Math.PI).step(0.01).listen();
    srcPos.open();

    var srcPos1 = gui.addFolder('Source Position(Cartesian)');
    var offset = 0.2;
    var sourceX = srcPos1.add(text, 
        'sourceX', -dimensions.width/2 + offset, 
        dimensions.width/2 - offset).step(0.01).listen();
    var sourceY = srcPos1.add(text, 
        'sourceY', -dimensions.height/2 + offset, 
        dimensions.height/2 - offset).step(0.01).listen();
    var sourceZ = srcPos1.add(text, 
        'sourceZ', -dimensions.depth/2 + offset, 
        dimensions.depth/2 - offset).step(0.01).listen();
    // srcPos1.open();

    var resetSourceMatrix = function() {
        text.range = Math.sqrt(sourcePos.x * sourcePos.x +
            sourcePos.y * sourcePos.y +
            sourcePos.z * sourcePos.z);
        text.azimuth = Math.atan(sourcePos.y/sourcePos.x);
        text.elevation = Math.acos(sourcePos.z/text.range);
        console.log(soundSource.matrix);
        source.setFromMatrix(soundSource.matrix);
    }

    var myInterval;
    var smoothTrans = function(curr, prev) {
        clearInterval(myInterval);
        var diff = curr.map((item, i) => {
            return item - prev[i];
        });
        var i = 0;
        myInterval = setInterval(function() {
            source.setFromMatrix();
        }, 10);
    }

    var resetSourceMatrixFromSpherical = function(x, y, z) {
        text.sourceX = x;
        text.sourceY = y;
        text.sourceZ = z;
        sourcePos = { x: x, y: y, z: z };
        soundSource.position.set(x, y, z);
        source.setFromMatrix(soundSource.matrix);
        for (var i = 0; i < 16; i++) {
            console.log(soundSource.matrix.elements[i] - prev[i]);
        }
        console.log(soundSource.matrix.elements);
        console.log(prev);
        prev = soundSource.matrix.elements.slice();
        // source.setPosition(x, y, z);
    }

    range.onChange(function(value) {
        var x = value * Math.sin(text.elevation) * Math.cos(text.azimuth),
            y = value * Math.sin(text.elevation) * Math.sin(text.azimuth),
            z = value * Math.cos(text.elevation);
        resetSourceMatrixFromSpherical(x, y, z);
    });

    azimuth.onChange(function(value) {
        var x = text.range * Math.sin(text.elevation) * Math.cos(value),
            y = text.range * Math.sin(text.elevation) * Math.sin(value),
            z = text.range * Math.cos(text.elevation);
        resetSourceMatrixFromSpherical(x, y, z);
    });

    elevation.onChange(function(value) {
        var x = text.range * Math.sin(value) * Math.cos(text.azimuth),
            y = text.range * Math.sin(value) * Math.sin(text.azimuth),
            z = text.range * Math.cos(value);
        resetSourceMatrixFromSpherical(x, y, z);
    });

    sourceX.onChange(function(value) {
        sourcePos.x = value;
        soundSource.position.x = value;
        resetSourceMatrix();
    });

    sourceY.onChange(function(value) {
        sourcePos.y = value;
        soundSource.position.y = value;
        resetSourceMatrix();
    });

    sourceZ.onChange(function(value) {
        sourcePos.z = value;
        soundSource.position.z = value;
        resetSourceMatrix();
    });

    // var srcRot= gui.addFolder('Source Rotation');
    // var sourceRX = srcRot.add(text, 
    //     'sourceRX', -Math.PI, Math.PI).step(0.01);
    // var sourceRY = srcRot.add(text, 
    //     'sourceRY', -Math.PI, Math.PI).step(0.01);
    // var sourceRZ = srcRot.add(text, 
    //     'sourceRZ', -Math.PI, Math.PI).step(0.01);
    // srcRot.open();

    // sourceRX.onChange(function(value) {
    //     soundSource.rotation.x = value;
    //     resetSourceMatrix();
    // });

    // sourceRY.onChange(function(value) {
    //     soundSource.rotation.y = value;
    //     resetSourceMatrix();
    // });

    // sourceRZ.onChange(function(value) {
    //     soundSource.rotation.z = value;
    //     resetSourceMatrix();
    // });

    var listenerRot= gui.addFolder('Listener Rotation');
    var listenerRX = listenerRot.add(text, 
        'listenerRX', -Math.PI, Math.PI).step(0.01);
    var listenerRY = listenerRot.add(text, 
        'listenerRY', -Math.PI, Math.PI).step(0.01);
    var listenerRZ = listenerRot.add(text, 
        'listenerRZ', -Math.PI, Math.PI).step(0.01);
    // listenerRot.open();

    var resetListenerMatrix = function() {
        audioScene.setListenerFromMatrix(listener.matrix);
    }

    listenerRX.onChange(function(value) {
        listener.rotation.x = value;
        resetListenerMatrix();
    });

    listenerRY.onChange(function(value) {
        listener.rotation.y = value;
        resetListenerMatrix();
    });

    listenerRZ.onChange(function(value) {
        listener.rotation.z = value;
        resetListenerMatrix();
    });

    // listener
    var lstnerPos = gui.addFolder('Listener Position');
    var offset = 0.1;
    var listenerX = lstnerPos.add(text, 
        'listenerX', -dimensions.width/2 + offset, dimensions.width/2 - offset);
    var listenerY = lstnerPos.add(text, 
        'listenerY', -dimensions.height/2 + offset, dimensions.height/2 - offset);
    var listenerZ = lstnerPos.add(text, 
        'listenerZ', -dimensions.depth/2 + offset, dimensions.depth/2 - offset);
    // lstnerPos.open();

    listenerX.onChange(function(value) {
        listenerPos.x = value;
        listener.position.x = value;
        resetListenerMatrix();
    });

    listenerY.onChange(function(value) {
        listenerPos.y = value;
        listener.position.y = value;
        resetListenerMatrix();
    });

    listenerZ.onChange(function(value) {
        listenerPos.z = value;
        listener.position.z = value;
        resetListenerMatrix();
    });

    // room
    var roomDims = gui.addFolder('Room Dimensions (in meters)');
    var width = roomDims.add(text, 'width', 0.5, 30);
    var height = roomDims.add(text, 'height', 0.5, 20);
    var depth = roomDims.add(text, 'depth', 0.5, 30);
    // roomDims.open();

    var resetRoomDims = function() {
        var minDim = Math.min(dimensions.width, dimensions.height, dimensions.depth);
        soundSource.scale.set(minDim*0.05, minDim*0.05, minDim*0.05);
        listener.scale.set(minDim*0.05, minDim*0.05, minDim*0.05);
        offset = minDim * 0.05;
        audioScene.setRoomProperties(dimensions, materials);
        range.max(Math.min(dimensions.width, dimensions.height, dimensions.depth)/2);
    }

    width.onFinishChange(function(value) {
        dimensions.width = value;
        room.scale.x = value;
        resetRoomDims();
        sourceX.min(-dimensions.width/2 + offset);
        sourceX.max(dimensions.width/2 - offset);
        text.sourceX = (text.sourceX > sourceX.__min? text.sourceX: sourceX.__min);
        text.sourceX = (text.sourceX < sourceX.__max? text.sourceX: sourceX.__max);
        listenerX.min(-dimensions.width/2 + offset);
        listenerX.max(dimensions.width/2 - offset);
    });

    height.onFinishChange(function(value) {
        dimensions.height = value;
        room.scale.y = value;
        resetRoomDims();
        text.sourceY = (text.sourceY > sourceY.__min? text.sourceY: sourceY.__min);
        text.sourceY = (text.sourceY < sourceY.__max? text.sourceY: sourceY.__max);
        sourceY.min(-dimensions.height/2 + offset);
        sourceY.max(dimensions.height/2 - offset);
        listenerY.min(-dimensions.height/2 + offset);
        listenerY.max(dimensions.height/2 - offset);
    });

    depth.onFinishChange(function(value) {
        dimensions.depth = value;
        room.scale.z = value;
        resetRoomDims();
        text.sourceZ = (text.sourceZ > sourceZ.__min? text.sourceZ: sourceZ.__min);
        text.sourceZ = (text.sourceZ < sourceZ.__max? text.sourceZ: sourceZ.__max);
        sourceZ.min(-dimensions.depth/2 + offset);
        sourceZ.max(dimensions.depth/2 - offset);
        listenerZ.min(-dimensions.depth/2 + offset);
        listenerZ.max(dimensions.depth/2 - offset);
    });

    // room material
    var roomMat = gui.addFolder('Room Material Coefficients');
    var materialTypes = [
        'uniform',
        'transparent',
        'acoustic-ceiling-tiles',
        'brick-bare',
        'brick-painted',
        'concrete-block-coarse',
        'concrete-block-painted',
        'curtain-heavy',
        'fiber-glass-insulation',
        // 'glass-thin',
        'glass-thick',
        'grass',
        // 'linoleum-on-concrete',
        'marble',
        'metal',
        'parquet-on-concrete',
        'plaster-smooth',
        'plywood-panel',
        'polished-concrete-or-tile',
        'sheetrock',
        'water-or-ice-surface',
        'wood-ceiling',
        'wood-panel'
    ];
    var left = roomMat.add(text, 'left', materialTypes);
    var right = roomMat.add(text, 'right', materialTypes);
    var front = roomMat.add(text, 'front', materialTypes);
    var back = roomMat.add(text, 'back', materialTypes);
    var up = roomMat.add(text, 'up', materialTypes);
    var down = roomMat.add(text, 'down', materialTypes);
    // roomMat.open();

    var resetRoomMaterials = function(dim, value) {
        if (value !== 'transparent') {
            room.material[dim].opacity = 1;
            room.material[dim].map = mat[value];
        } else {
            room.material[dim].opacity = 0;
        }
        audioScene.setRoomProperties(dimensions, materials);
    }

    left.onFinishChange(function(value) {
        materials.left = value;
        resetRoomMaterials(DIM.LEFT, value);
    });

    right.onFinishChange(function(value) {
        materials.right = value;
        resetRoomMaterials(DIM.RIGHT, value);
    });

    up.onFinishChange(function(value) {
        materials.up = value;
        resetRoomMaterials(DIM.UP, value);
    });

    down.onFinishChange(function(value) {
        materials.down = value;
        resetRoomMaterials(DIM.DOWN, value);
    });

    front.onFinishChange(function(value) {
        materials.front = value;
        resetRoomMaterials(DIM.FRONT, value);
    });

    back.onFinishChange(function(value) {
        materials.back = value;
        resetRoomMaterials(DIM.BACK, value);
    });

    gui.add(text, 'play');
}

function setupScene() {
    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x889988 );
    document.body.appendChild( renderer.domElement );

    // scene
    scene = new THREE.Scene();

    // var axesHelper = new THREE.AxesHelper( 1 );
    // scene.add( axesHelper );
    
    // camera
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 4, 4, 4 );
    scene.add( camera ); // required, since adding light as child of camera

    // controls
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2;
    
    // ambient
    scene.add( new THREE.AmbientLight( 0xf2f2f2 ) );

    // light
    // var light = new THREE.PointLight( 0xffffff, 0.8 );
    // light.position.y = -0.5;
    // scene.add( light );
}

function setupListerner() {
    var fbxLoader = new THREE.FBXLoader();
    fbxLoader.load('models/deer1.fbx', function(object) {
        listener = object;
        listener.scale.set(.1, .1, .1);
        scene.add(listener);
        // var axes = new THREE.AxesHelper( 10 );
        // listener.add(axes);
    })
}

function setupSource() {
    // var tdsLoader = new THREE.TDSLoader();
    // var objectUrl = 'models/Parlante_3_5P_4_Ohms.3ds';
    // // var material = new THREE.MeshPhongMaterial({});
    // tdsLoader.load(objectUrl, function(object) {
    //     soundSource = object;
    //     soundSource.scale.set(.004, .004, .004);
    //     soundSource.position.set(sourcePos.x,
    //         sourcePos.y,
    //         sourcePos.z);
    //     scene.add(soundSource);
    //     var axes = new THREE.AxesHelper( 100 );
    //     soundSource.add(axes);
    // });

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshPhongMaterial( {color: 0xffffff} );
    soundSource = new THREE.Mesh( geometry, material );
    soundSource.position.set(sourcePos.x,
        sourcePos.y,
        sourcePos.z);
    soundSource.scale.set(.1, .1, .1);
    prev = soundSource.matrix.elements.slice();
    scene.add( soundSource );
    // var axes = new THREE.AxesHelper( 10 );
    // soundSource.add(axes);
}


function setupRoom() {
    // geometry
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    // geometry.computeVertexNormals();
    // geometry.computeBoundingBox();

    // material
    var material1 = new THREE.MeshPhongMaterial( {
        color: 0xffffff, 
        transparent: true,
        opacity: .1
    } );
    
    // mesh
    // roomOuter = new THREE.Mesh( geometry, material1 );
    // scene.add( roomOuter );

    var xFront = new THREE.MeshPhongMaterial({side: THREE.BackSide, transparent: true}),
        xBack = new THREE.MeshPhongMaterial({side: THREE.BackSide, transparent: true}),
        ceiling = new THREE.MeshPhongMaterial({side: THREE.BackSide, transparent: true}),
        floor = new THREE.MeshPhongMaterial({side: THREE.BackSide, transparent: true}),
        zFront = new THREE.MeshPhongMaterial({side: THREE.BackSide, transparent: true}),
        zBack = new THREE.MeshPhongMaterial({side: THREE.BackSide, transparent: true});
    
    // order to add materials: x+,x-,y+,y-,z+,z-
    var roomMaterial = [
        xFront,
        xBack,
        ceiling,
        floor,
        zFront,
        zBack
    ];

    var textureLoader = new THREE.TextureLoader();
    mat = {
        'brick-bare': textureLoader.load(TEXTURES.BARE_BRICK),
        'acoustic-ceiling-tiles': textureLoader.load(TEXTURES.ACOUSTIC),
        'brick-bare': textureLoader.load(TEXTURES.BARE_BRICK),
        'brick-painted': textureLoader.load(TEXTURES.PAINTED_BRICK),
        'concrete-block-coarse': textureLoader.load(TEXTURES.CONCRETE),
        'concrete-block-painted': textureLoader.load(TEXTURES.CONCRETE2),
        'curtain-heavy': textureLoader.load(TEXTURES.CURTAIN),
        'fiber-glass-insulation': textureLoader.load(TEXTURES.FIBERGLASS),
        'glass-thick': textureLoader.load(TEXTURES.GLASS_THICK),
        'grass': textureLoader.load(TEXTURES.GRASS),
        'marble': textureLoader.load(TEXTURES.MARBLE),
        'metal': textureLoader.load(TEXTURES.METAL),
        'parquet-on-concrete': textureLoader.load(TEXTURES.PARQUET),
        'plaster-smooth': textureLoader.load(TEXTURES.PLASTER),
        'plywood-panel': textureLoader.load(TEXTURES.PLYWOOD),
        'polished-concrete-or-tile': textureLoader.load(TEXTURES.POLISHED_CONCRETE),
        'sheetrock': textureLoader.load(TEXTURES.SHEETROCK),
        'water-or-ice-surface': textureLoader.load(TEXTURES.WATER),
        'wood-panel': textureLoader.load(TEXTURES.WOOD),
        'wood-ceiling': textureLoader.load(TEXTURES.WOOD),
        'uniform': textureLoader.load(TEXTURES.UNIFORM)
    }
    roomMaterial[DIM.DOWN].map = mat[materials.down];
    roomMaterial[DIM.FRONT].map = mat[materials.front];
    roomMaterial[DIM.BACK].map = mat[materials.back];
    roomMaterial[DIM.LEFT].map = mat[materials.left];
    roomMaterial[DIM.RIGHT].map = mat[materials.right];
    roomMaterial[DIM.UP].map = mat[materials.up];
    setTexture([mat['wood-panel'], 
        mat['acoustic-ceiling-tiles'],
        mat['brick-bare'],
        mat['brick-painted'],
        mat['concrete-block-coarse'],
        mat['concrete-block-painted'],
        mat['marble'],
        mat['plywood-panel']]);

    // mesh
    room = new THREE.Mesh( geometry, roomMaterial );
    room.scale.set(dimensions.width, dimensions.height, dimensions.depth);
    scene.add( room );
}

function setTexture(textures) {
    textures.forEach(texture => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( dimensions.width, dimensions.depth );
    });
}

function animate() {

    requestAnimationFrame( animate );
    
    //controls.update();

    renderer.render( scene, camera );

}
