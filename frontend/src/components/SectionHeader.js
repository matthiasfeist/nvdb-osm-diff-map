function SectionHeader(props) {
  return (
    <header className="shadow-md bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <h2 className="text-2xl leading-6 font-medium tracking-tight text-gray-900">
          {props.children}
        </h2>
      </div>
    </header>
  )
}
export default SectionHeader
