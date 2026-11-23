// Ana oyunun hızlarını Matter birimlerine çevirir; hareketi çizimden bağımsız fizik adımlarında uygular.
import type {MatterLibrary} from './MatterObjects.js';

const FRAME_SECONDS = 1 / 60;
const motors = new WeakMap<MatterJS.BodyType, {speed: number}>();
export const labMotion = {
    gravity: 1.6, // Matter'ın varsayılan ölçeğinde 1600 piksel/saniye².
    speed: 265 * FRAME_SECONDS,
    jump: 590 * FRAME_SECONDS,
    shortJump: 240 * FRAME_SECONDS,
    groundAcceleration: 1500,
    airAcceleration: 1350,
    turning: 2200,
    groundBraking: 700,
    airBraking: 220,
    mass: 2.5,
    maxGroundForce: .02,
    maxAirForce: .004
};

export function moveLabPlayer(matter: MatterLibrary, body: MatterJS.BodyType,
    direction: number, grounded: boolean, delta: number) {
    let motor = motors.get(body);
    if (!motor) { motor = {speed: body.velocity.x}; motors.set(body, motor); }
    // Yürürken duvara yapışma; dururken sürtünme, hareketli desteğin üzerinde tutar.
    body.friction = direction || !grounded ? 0 : .2;
    body.frictionStatic = direction || !grounded ? 0 : 1;
    const acceleration = direction === 0
        ? grounded ? labMotion.groundBraking : labMotion.airBraking
        : direction * motor.speed < 0 ? labMotion.turning
        : grounded ? labMotion.groundAcceleration : labMotion.airAcceleration;
    const change = acceleration * Math.min(delta, 50) / 1000 * FRAME_SECONDS;
    const difference = direction * labMotion.speed - motor.speed;
    motor.speed += Math.max(-change, Math.min(change, difference));
    if (!direction && grounded) { motor.speed = body.velocity.x; return; }
    // Temas karakteri yavaşlatsa da kumandanın istediği hızı kaybetme.
    // İtiş gücü sınırlıdır; duvarın içinden geçmeye zorlayan sınırsız bir motor değildir.
    const velocityChange = motor.speed - body.velocity.x;
    const requestedForce = body.mass * velocityChange / (1000 * FRAME_SECONDS * delta);
    const forceLimit = grounded ? labMotion.maxGroundForce : labMotion.maxAirForce;
    // Hızı zorla atamak yerine sınırlı kuvvet uygula. Kutular yalnızca temasla itilir;
    // yön değiştiğinde kutunun hızına veya konumuna hiçbir müdahale yapılmaz.
    matter.Body.applyForce(body, body.position,
        {x: Math.max(-forceLimit, Math.min(forceLimit, requestedForce)), y: 0});
}
