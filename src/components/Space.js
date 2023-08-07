import { Viewer, Cesium3DTileset, Entity, CzmlDataSource } from "resium";
import { Cartesian3, IonResource } from "cesium";
import { Ion } from "cesium";
import { useEffect, useState } from "react";
//import sat3d from "./sat2/scene.gltf"
import { propagate, twoline2satrec } from "satellite.js";
import axios from "axios";

Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZTgzZGIyZi04ZDYyLTQyOTItOGFkNy02N2MyZjRkODhhZWYiLCJpZCI6MTUxNDQ0LCJpYXQiOjE2ODg1MTM5MDh9.iNH_p5aPb4WSWUYsL67syV8UeshgYa6zYiegZYs-xjc";

function Space() {

    //const [position, setPosition] = useState(Cartesian3.fromDegrees(-75.59777, 40.03883, 1000));
    const [tle1, setTle1] = useState();
    const [tle2, setTle2] = useState();
    const [description, setDescription] = useState("");
    const [czmlData, setCzmlData] = useState();

    let viewer; // This will be raw Cesium's Viewer object.

    const handleReady = tileset => {
        if (viewer) {
            viewer.zoomTo(tileset);
        }
    };


    const getTLEData = async () => {
        const TLE = await axios.get("https://api.tinygs.com/v1/satellite/FossaSat-FX14");
        console.log(TLE.data.tle);
        console.log(TLE.data.description);
        setDescription(TLE.data.description);
        setTle1(TLE.data.tle[1]);
        setTle2(TLE.data.tle[2]);
    }

    const calculateCZML = () => {
        const tleSatellite = twoline2satrec(tle1, tle2);
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 6 * 3600 * 1000); // Un intervalo de 24 horas desde el tiempo inicial
        const czmlDataProv = [{
            "id": "document",
            "name": "simple",
            "version": "1.0",
            "clock": {
                "interval": `${startTime.toISOString().split('.')[0] + 'Z'}/${endTime.toISOString().split('.')[0] + 'Z'}`,
                "currentTime": startTime.toISOString().split('.')[0] + 'Z',
                "multiplier": 5,
                "range": "LOOP_STOP",
                "step": "SYSTEM_CLOCK_MULTIPLIER"
            }
        }];

        const cartesian = [];
        let contador = 0;
        const timeInterval = 60;

        for (let time = startTime; time < endTime; time = new Date(time.getTime() + 5 * timeInterval * 1000)) {
            const positionAndVelocity = propagate(tleSatellite, time);
            const positionEci = positionAndVelocity.position;
            console.log(contador, positionEci.x, positionEci.y, positionEci.z);
            cartesian.push(
                contador,
                positionEci.x *1000,
                positionEci.y *1000,
                positionEci.z *1000,
            );
            contador = contador + 5 * 60;
        }

        console.log(cartesian);

        czmlDataProv.push({
            id: "Satellite/Platzi",
            name: "PLATZI-SAT",
            description: description,
            availability: `${startTime.toISOString().split('.')[0] + 'Z'}/${endTime.toISOString().split('.')[0] + 'Z'}`,
            model: {
                show: true,
                gltf: "./sat/scene.gltf"
            },
            "billboard": {
                "eyeOffset": {
                    "cartesian": [
                        0, 0, 0
                    ]
                },
                "horizontalOrigin": "CENTER",
                "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADJSURBVDhPnZHRDcMgEEMZjVEYpaNklIzSEfLfD4qNnXAJSFWfhO7w2Zc0Tf9QG2rXrEzSUeZLOGm47WoH95x3Hl3jEgilvDgsOQUTqsNl68ezEwn1vae6lceSEEYvvWNT/Rxc4CXQNGadho1NXoJ+9iaqc2xi2xbt23PJCDIB6TQjOC6Bho/sDy3fBQT8PrVhibU7yBFcEPaRxOoeTwbwByCOYf9VGp1BYI1BA+EeHhmfzKbBoJEQwn1yzUZtyspIQUha85MpkNIXB7GizqDEECsAAAAASUVORK5CYII=",
                "pixelOffset": {
                    "cartesian2": [
                        0, 0
                    ]
                },
                "scale": 1,
                "show": true,
                "verticalOrigin": "CENTER"
            },

            "label": {
                "fillColor": {
                    "rgba": [
                        255, 255, 0, 255
                    ]
                },
                "font": "11pt Lucida Console",
                "horizontalOrigin": "LEFT",
                "outlineColor": {
                    "rgba": [
                        0, 0, 0, 255
                    ]
                },
                "outlineWidth": 2,
                "pixelOffset": {
                    "cartesian2": [
                        6, -4
                    ]
                },
                "show": true,
                "style": "FILL_AND_OUTLINE",
                //Texto a mostrar sobre la imagen
                "text": "PLATZI SAT 1",
                "verticalOrigin": "CENTER"
            },
            "path": {
                "show": [
                    {
                        "interval": `${startTime.toISOString().split('.')[0] + 'Z'}/${endTime.toISOString().split('.')[0] + 'Z'}`, //"2012-03-15T10:00:00Z/2012-03-16T10:00:00Z",
                        "boolean": true
                    }
                ],
                "width": 2,
                "material": {
                    "solidColor": {
                        "color": {
                            "rgba": [
                                255, 255, 0, 255
                            ]
                        }
                    }
                },
                "resolution": 120,
            },
            position: {
                "interpolationAlgorithm": "LAGRANGE",
                "interpolationDegree": 5,
                "referenceFrame": "INERTIAL",
                "epoch": startTime.toISOString().split('.')[0] + 'Z',
                "cartesian": cartesian
            },


        });
        
        console.log(czmlDataProv);
        setCzmlData(czmlDataProv);
    }

    const modelo3d = {
        id: "model1",
        name: "PLATZI SAT",
        position: {
            cartographicDegrees: [
                -77.1693783232,
                -12.0733176266,
                1000.0
            ],
        },
        model: {
            show: true,
            gltf: "./sat/scene.gltf"
        },
    }



    useEffect(() => {
        getTLEData();
    }, []);

    useEffect(() => {
        if (tle1, tle2) {

            calculateCZML();
        }
    }, [tle1, tle2]);

    return (
        <Viewer
            full
            ref={e => {
                viewer = e && e.cesiumElement;
            }}>
            <CzmlDataSource data={czmlData} />
        </Viewer>
    );
}

export default Space;