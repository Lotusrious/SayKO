import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => {
  const nodeRef = useRef(null);

  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames="modal-fade"
      unmountOnExit
      nodeRef={nodeRef}
    >
      <div 
        ref={nodeRef}
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-xl w-11/12 max-w-sm p-6 text-center"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </CSSTransition>
  );
};

export default AlertModal; 