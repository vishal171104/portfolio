                  export const getWaveHeight = (x: number, z: number, time: number, impactFactor: number, scrollProgress: number) => {
    let y = 0;

    // JS equivalent of the glsl gerstnerWave function Y-displacement
    const evalGerstnerY = (dirX: number, dirY: number, steepness: number, wavelength: number) => {
        const k = 2.0 * Math.PI / wavelength;
        const c = Math.sqrt(9.8 / k);
        // normalize direction
        const d_mag = Math.sqrt(dirX * dirX + dirY * dirY);
        const dn_x = d_mag === 0 ? 0 : dirX / d_mag;
        const dn_y = d_mag === 0 ? 0 : dirY / d_mag;

        const f = k * ((dn_x * x + dn_y * z) - c * time);
        const a = steepness / k;

        return a * Math.sin(f);
    };

    y += evalGerstnerY(1.0, 0.8, 0.3, 10.0);
    y += evalGerstnerY(0.5, 1.0, 0.25, 15.0);
    y += evalGerstnerY(-1.0, 0.3, 0.15, 8.0);

    // Tsunami wave
    const tsunamiSteepness = 0.5 + (impactFactor * 0.5) + (scrollProgress * 0.4);
    y += evalGerstnerY(0.0, 1.0, tsunamiSteepness, 50.0);

    return y;
};
