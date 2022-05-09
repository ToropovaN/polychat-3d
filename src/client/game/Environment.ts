import {
    ActionManager,
    Color3, ExecuteCodeAction,
    Mesh,
    Scene, SceneLoader, StandardMaterial, Vector2, Texture,
    Vector3, VertexBuffer, MeshBuilder, CubeTexture, Tools, PBRMaterial, AnimationGroup,
} from "@babylonjs/core";
import {
    WaterMaterial
} from "@babylonjs/materials";
import {Nullable} from "@babylonjs/core/types";
import {Node} from "@babylonjs/core/node";

export class Environment {
    private _scene: Scene;

    private itemsMap = {
        "tree1": null,
        "tree2": null,
        "treePine1": null,
        "treePine2": null,
        "treePine3": null,
        "bush1": null,
        "bush2": null,
        "flowerbed1": null,
        "flowerbed2": null,
        "flowers1": null,
        "flowers2": null,
        "flowers3": null,
        "grass1": null,
        "grass2": null,
        "grassField": null
    }

    private grassMaterial;
    private asphaltMaterial;
    private lightAsphaltMaterial;
    private earthMaterial;
    private skyboxMaterial;
    private waterMaterial;


    constructor(scene: Scene) {
        this._scene = scene;

        this.grassMaterial = new StandardMaterial("grassMaterial", this._scene);
        this.grassMaterial.diffuseTexture = new Texture("/textures/grass.png", this._scene);
        this.grassMaterial.bumpTexture = new Texture("/textures/grass_NRM.jpg", this._scene);
        this.grassMaterial.bumpTexture.level = 0.2;

        this.earthMaterial = new PBRMaterial("earthMaterial", this._scene);
        this.earthMaterial.albedoTexture = new Texture("/textures/earth.png", this._scene);
        this.earthMaterial.bumpTexture = new Texture("/textures/earth_NRM.jpg", this._scene);
        this.earthMaterial.bumpTexture.level = 0.15;
        this.earthMaterial.roughness = 1;
        this.earthMaterial.metallic = 0.2;

        this.asphaltMaterial = new StandardMaterial("asphaltMaterial", this._scene);
        this.asphaltMaterial.diffuseTexture = new Texture("/textures/asphalt.png", this._scene);
        this.asphaltMaterial.bumpTexture = new Texture("/textures/asphalt_NRM.jpg", this._scene);
        this.asphaltMaterial.diffuseColor = new Color3(0.65, 0.63, 0.67);
        this.asphaltMaterial.bumpTexture.level = 0.4;

        this.lightAsphaltMaterial = this.asphaltMaterial.clone();
        this.lightAsphaltMaterial.diffuseColor = new Color3(0.91, 0.87, 0.84);


        this.skyboxMaterial = new StandardMaterial("skyBox", scene);
        this.skyboxMaterial.backFaceCulling = false;
        this.skyboxMaterial.reflectionTexture = new CubeTexture("/textures/Sky", scene);
        this.skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        this.skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        this.skyboxMaterial.specularColor = new Color3(0, 0, 0);
        this.skyboxMaterial.disableLighting = true;


        this.waterMaterial = new WaterMaterial("water", scene);
        this.waterMaterial.bumpTexture = new Texture("textures/waterbump.png", scene);
        this.waterMaterial.windForce = -2;
        this.waterMaterial.waveHeight = 0;
        this.waterMaterial.windDirection = new Vector2(1, 1);
        this.waterMaterial.waterColor = new Color3(0.1, 0.1, 0.6);
        this.waterMaterial.colorBlendFactor = 0.3;
        this.waterMaterial.bumpHeight = 0.70;
        this.waterMaterial.waveLength = 2;

        this.waterMaterial.a = 0.1;

    }

    async load(){
        const mapResult = await SceneLoader.ImportMeshAsync(null, "./models/", "envSetting.glb", this._scene);
        const env = mapResult.meshes[0];
        const nodes = mapResult.transformNodes;

        const allMeshes = env.getChildMeshes();
        allMeshes.forEach(m => {
            m.receiveShadows = false;
            m.checkCollisions = false;
            m.isPickable = false;
            m.isVisible = true;

            /*if (m.name == "ground") {
                m.checkCollisions = false;
                m.isPickable = false;
            }*/
            //collision meshes
            if (m.name.includes("CollisionGround")) {
                m.isVisible = false;
                m.isPickable = true;
                m.checkCollisions = true;
            }
            if (m.name.includes("CollisionWall")) {
                m.isVisible = false;
                m.checkCollisions = true;
            }
            if (m.name.includes("Grass")) {
                m.material = this.grassMaterial;
                //(m as Mesh).markVerticesDataAsUpdatable(VertexBuffer.NormalKind, true);
                //(m as Mesh).applyDisplacementMap("/textures/grass_DISP.jpg", 0, 10);
            }
            if (m.name.includes("Asphalt")) { (m.name.includes("LightAsphalt")) ? m.material = this.lightAsphaltMaterial : m.material = this.asphaltMaterial; }
            if (m.name.includes("Earth")) {
                m.material = this.earthMaterial;
                //(m as Mesh).markVerticesDataAsUpdatable(VertexBuffer.NormalKind, true);
                //(m as Mesh).applyDisplacementMap("/textures/earth_DISP.jpg", 0, 10);
            }

            if (m.name.includes("skybox")) {
                m.material = this.skyboxMaterial;
                this.waterMaterial.addToRenderList(m);
            }
            if (m.name.includes("Water")) {
                //m.material = this.waterMaterial;
                let water = (m as Mesh).clone("Water");
                water.position.y += 5;
                water.material = this.waterMaterial;
                this.waterMaterial.addToRenderList(m);
            }

        });

        await this.loadItem("tree1");
        await this.loadItem("tree2");
        await this.loadItem("treePine1");
        await this.loadItem("treePine2");
        await this.loadItem("treePine3");
        await this.loadItem("bush1");
        await this.loadItem("bush2");
        await this.loadItem("flowerbed1");
        await this.loadItem("flowerbed2");
        await this.loadItem("flowers1");
        await this.loadItem("flowers2");
        await this.loadItem("flowers3");
        await this.loadItem("grass1");
        await this.loadItem("grass2");
        await this.loadItem("grassField");

        nodes.forEach( n => {
            if (n.name.includes("(item)")){
                let nName = n.name.substring(n.name.indexOf(")") + 1, n.name.indexOf("["));
                let nMesh = this.itemsMap[nName].clone(n.name + "Mesh");

                nMesh.position = n.getAbsolutePosition();
                if (n.name.includes("_")) {
                    let scale = parseFloat(n.name.substring(n.name.indexOf("_") + 1, n.name.indexOf("/")));
                    let rotate = parseFloat(n.name.substring(n.name.indexOf("/") + 1, n.name.length));

                    nMesh.scaling = new Vector3(scale, scale, scale);
                    if (rotate > 0) {
                        nMesh.rotationQuaternion = null;
                        nMesh.rotation.y = rotate;
                    }
                }
            }
        });
        this._scene.stopAllAnimations();
    }

    async loadItem(name){
        let Result = await SceneLoader.ImportMeshAsync(null, "./models/items/", name + ".glb", this._scene);
        let meshes = Result.meshes[0];
        meshes.getChildMeshes().forEach(m => {
            m.checkCollisions = m.name.includes("Collision");
            m.isVisible = !(m.name.includes("Collision"));
            m.isPickable = m.name.includes("CollisionGround");
            //m.checkCollisions = false;
            //m.isPickable = false;
            if (m.name.includes("(light)")) {
                (m.material as StandardMaterial).emissiveColor = new Color3(1, 1, 1);
                (m.material as StandardMaterial).emissiveTexture = (m.material as PBRMaterial).albedoTexture;
            }
        });

        meshes.position.x = -200;
        this.itemsMap[name] = meshes;
    }
}