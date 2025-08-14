function LevelIndicator({ level }) {
  return (
    <div className="absolute top-4 right-4 bg-pink-500 text-white text-2xl font-bold p-4 rounded-full">
      Level {level}
    </div>
  );
}

export default LevelIndicator;
