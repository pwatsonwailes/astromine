import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryNode, StoryChapter } from '../../types/story';
import { GalleryNode } from './nodes/GalleryNode';
import { ParagraphNode } from './nodes/ParagraphNode';
import { ChoiceNode } from './nodes/ChoiceNode';
import { ButtonNode } from './nodes/ButtonNode';
import { CharacterPanel } from './CharacterPanel';
import { checkNodeRequirements } from '../../utils/story';
import { useAudio } from '../../utils/audio';

interface StoryViewProps {
  chapter: StoryChapter;
  onComplete: () => void;
  onChoice: (choiceId: string, picked: number) => void;
  choices: Record<string, number>;
}

export const StoryView: React.FC<StoryViewProps> = ({
  chapter,
  onComplete,
  onChoice,
  choices = {}
}) => {
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [activeCharacters, setActiveCharacters] = useState<Set<string>>(new Set());
  const currentNode = chapter.nodes[currentNodeIndex];

  useAudio(
    currentNode?.media?.music?.track,
    currentNode?.media?.music?.volume
  );

  useEffect(() => {
    if (!currentNode) return;
    
    if (currentNode.media?.character) {
      setActiveCharacters(prev => {
        const next = new Set(prev);
        if (currentNode.media?.character?.name) {
          next.add(currentNode.media.character.name);
        }
        return next;
      });
    }
  }, [currentNode]);

  const handleNext = () => {
    if (currentNodeIndex < chapter.nodes.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleChoice = (choiceId: string, picked: number) => {
    onChoice(choiceId, picked);
    handleNext();
  };

  const renderNode = (node: StoryNode) => {
    if (!node || !checkNodeRequirements(node, choices)) {
      handleNext();
      return null;
    }

    switch (node.type) {
      case 'gallery':
        return <GalleryNode node={node} onComplete={handleNext} />;
      case 'paragraph':
        return <ParagraphNode node={node} onComplete={handleNext} />;
      case 'choice':
        if (!node.id) return null;
        return (
          <ChoiceNode
            node={node}
            onChoice={(picked) => handleChoice(node.id!, picked)}
          />
        );
      case 'button':
        return (
          <ButtonNode
            node={node}
            onComplete={node.mode === 'cards' ? onComplete : handleNext}
          />
        );
      default:
        return null;
    }
  };

  if (!currentNode) return null;

  // For gallery nodes, render full screen
  if (currentNode.type === 'gallery') {
    return (
      <div className="fixed inset-0 bg-black">
        {renderNode(currentNode)}
      </div>
    );
  }

  // For all other nodes, render split view
  return (
    <div className="fixed inset-0 bg-black flex">
      {/* Left Panel - Background and Characters */}
      <div className="w-2/3 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentNodeIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {currentNode.media?.image && (
              <div
                className="absolute inset-0 bg-center bg-cover"
                style={{ backgroundImage: `url(/images/${currentNode.media.image.src}.jpg)` }}
              />
            )}
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <CharacterPanel
            characters={Array.from(activeCharacters).map(name => ({
              name,
              image: `/images/${name.toLowerCase()}.jpg`
            }))}
          />
        </div>
      </div>

      {/* Right Panel - Story Text and Interactions */}
      <div className="w-1/3 bg-gray-900 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentNodeIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-lg mx-auto">
                {renderNode(currentNode)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};