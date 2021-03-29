function OsmFileOverview(props) {
  const { problemToShow, setProblemToShow } = props

  const button = (tag, caption) => {
    const css =
      problemToShow === tag
        ? 'bg-blue-50 border border-blue-500 shadow text-gray-900 px-3 py-2 rounded-md text-sm font-medium'
        : 'bg-white border border-transparent shadow text-gray-900 px-3 py-2 rounded-md text-sm font-medium'
    const onClick = () => {
      setProblemToShow(tag)
    }
    return (
      <button className={css} onClick={onClick}>
        {caption}
      </button>
    )
  }

  return (
    <div className="max-w-7xl mx-auto bg-gray-100 px-2 my-3 space-x-2">
      {button('maxspeed', 'Maxspeed')}
      {button('lanes', 'Lanes')}
      {button('highway', 'Highway type')}
      {button('name', 'Name')}
      {button('missingMajorRoad', 'Missing road or large geometry differences')}
    </div>
  )
}

export default OsmFileOverview
