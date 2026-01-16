import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import confetti from 'canvas-confetti';
import { audioController } from '../utils/sound';

const BOARD_WIDTH = 800;
const BOARD_HEIGHT = 650;
const ROWS = 12;
const PEG_RADIUS = 3;
const BALL_RADIUS = 5;

// Colors
const COLOR_PRIMARY = '#7C3AED';

export default function PlinkoAnimation({
  gameResult,
  path,
  isAnimating,
  onAnimationComplete,
  dropColumn,
  isMuted,
  tiltAngle
}) {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const ballRef = useRef(null);
  const pegsRef = useRef([]);

  useEffect(() => {
    audioController.init();
    audioController.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      World = Matter.World;

    const engine = Engine.create();
    engineRef.current = engine;

    engine.enableSleeping = false;
    engine.world.gravity.y = 1.2;
    engine.world.gravity.x = 0;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio
      }
    });
    renderRef.current = render;

    const pegs = [];
    const spacingX = BOARD_WIDTH / 14;
    const spacingY = BOARD_HEIGHT / (ROWS + 2);
    const startY = 80;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col <= row + 2; col++) {
        const x = (BOARD_WIDTH / 2) - ((row + 2) * spacingX / 2) + (col * spacingX);
        const y = startY + row * spacingY;

        const peg = Bodies.circle(x, y, PEG_RADIUS, {
          isStatic: true,
          label: `peg-${row}-${col}`,
          render: {
            fillStyle: 'rgba(255, 255, 255, 0.2)',
            shadowBlur: 10,
            shadowColor: COLOR_PRIMARY
          }
        });

        peg.plugin = { originalFill: 'rgba(255, 255, 255, 0.2)' };
        pegs.push(peg);
      }
    }
    pegsRef.current = pegs;
    Composite.add(engine.world, pegs);

    // Create Bins (Walls and Floor)
    const floor = Bodies.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT + 10, BOARD_WIDTH, 20, {
      isStatic: true,
      label: 'floor',
      render: { fillStyle: 'transparent' }
    });

    const walls = [];
    const lastRow = ROWS - 1;
    for (let col = 0; col <= lastRow + 2; col++) {
      const x = (BOARD_WIDTH / 2) - ((lastRow + 2) * spacingX / 2) + (col * spacingX);
      const y = startY + lastRow * spacingY + spacingY / 2; // Start below the last peg
      const wallHeight = BOARD_HEIGHT - y;
      
      const wall = Bodies.rectangle(x, y + wallHeight / 2, 4, wallHeight, {
        isStatic: true,
        label: `wall-${col}`,
        render: {
          fillStyle: 'rgba(255, 255, 255, 0.1)',
          visible: true
        }
      });
      walls.push(wall);
    }
    Composite.add(engine.world, [floor, ...walls]);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    // Collision Events
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        const peg = bodyA.label.startsWith('peg') ? bodyA : bodyB.label.startsWith('peg') ? bodyB : null;
        const ball = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;

        if (peg && ball) {
          audioController.playPegHit();

          peg.render.fillStyle = '#fff';
          setTimeout(() => {
            peg.render.fillStyle = peg.plugin.originalFill;
          }, 100);
        }
      });
    });

    // Game Update Loop
    Events.on(engine, 'beforeUpdate', () => {
      if (!ballRef.current) return;
      const ball = ballRef.current;

      // Check for win condition (settled in bin)
      if (ball.speed < 0.1 && ball.angularSpeed < 0.1 && ball.position.y > BOARD_HEIGHT - 100) {
        if (!ball.isSettled) {
            ball.isSettled = true;
            // Freeze the ball
           // Matter.Body.setStatic(ball, true);
            
             // Confetti
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.8 },
              colors: [COLOR_PRIMARY, '#10B981', '#FFFFFF']
            });
    
            // Play Win Sound (assuming multiplier > 1, pass actual if possible, simplistic here)
            audioController.playWin(10);
    
            if (onAnimationComplete) onAnimationComplete();
        }
      }
      
      // Failsafe cleanup if it falls out somehow
      if (ball.position.y > BOARD_HEIGHT + 100) {
         Matter.Composite.remove(engine.world, ball);
         ballRef.current = null;
      }
    });

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
      World.clear(engine.world);
      Engine.clear(engine);
    };
  }, [isAnimating, onAnimationComplete]);

  // Handle Drop
  useEffect(() => {
    if (isAnimating && path && path.length > 0) {
      dropBall();
    }
  }, [isAnimating, path]);


  const dropBall = () => {
    // Cleanup previous ball if exists
    if (ballRef.current && engineRef.current) {
      Matter.Composite.remove(engineRef.current.world, ballRef.current);
      ballRef.current = null;
    }
    if (!engineRef.current) return;

    const x = (BOARD_WIDTH / 2) + (Math.random() - 0.5) * 2;
    const y = 20;

    const ball = Matter.Bodies.circle(x, y, BALL_RADIUS, {
      restitution: 0.5,
      friction: 0.5,
      density: 0.04,
      label: 'ball',
      render: {
        fillStyle: '#FF0055',
        shadowBlur: 15,
        shadowColor: '#FF0055'
      }
    });

    ballRef.current = ball;
    Matter.Composite.add(engineRef.current.world, ball);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={sceneRef}
        className="game-canvas-container"
        style={{ filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.2))' }}
      />
    </div>
  );
}