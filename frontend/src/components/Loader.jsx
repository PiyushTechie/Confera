import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loading-wave">
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  /* Center the loader inside the parent container */
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%; 
  height: 100%;

  .loading-wave {
    /* Auto width and fixed small height to fit button */
    width: auto;
    height: 20px; 
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }

  .loading-bar {
    width: 4px;
    height: 10px;
    margin: 0 3px;
    background-color: #ffffff; /* White bars to match button text */
    border-radius: 5px;
    animation: loading-wave-animation 1s ease-in-out infinite;
  }

  .loading-bar:nth-child(2) {
    animation-delay: 0.1s;
  }

  .loading-bar:nth-child(3) {
    animation-delay: 0.2s;
  }

  .loading-bar:nth-child(4) {
    animation-delay: 0.3s;
  }

  @keyframes loading-wave-animation {
    0% {
      height: 5px;
    }

    50% {
      height: 20px; /* Max height fits within button */
    }

    100% {
      height: 5px;
    }
  }
`;

export default Loader;