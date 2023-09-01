<script>
  export let panelInfo
</script>

<div class="card rounded-0 flex-grow-1 m-1">
  <div class="card-header d-flex flex-grow-0 align-items-end">
    <div class="mt-0"><h5>{panelInfo.title}</h5></div>
    <div class="ms-auto">
      <div class="dropdown">
        <button
          class="btn btn-primary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i class="bi bi-plus-circle"></i> Add action
        </button>
        <ul class="dropdown-menu">
          <li>
            <button class="dropdown-item" type="button">Apply codes to commits by pattern</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div class="card-body flexOverflow overflow-y-scroll" id="actionsTop">
    <p>
      Players investigate a mystery by examining different samples under a microscope. Slowly, they
      start finding messages <em>within the samples</em> about unexpected things and events. This information
      will have to be considered when players decide what to do about the mystery.
    </p>
    <p>
      The entity contacting them through the samples is revealed to be <strong>cardboard</strong> itself.
      All (or at least most) of it. Cardboard has an almost omnipresent collective consciousness, which
      is based in touch and close proximity. The tree networks originally key to forests got expanded
      within the material of the cardboard itself, as paper and pulp are created from the fibers of different
      trees. As cardboard gets recycled and repurposed, the fibers mix in the memories, knowledge and
      messages from the trees and boxes they previously were. As cardboard boxes travel as packaging,
      the network expands from different areas and forests around the globe, following the pathways of
      global logistics.
    </p>
    <p>
      As the game progresses, a set of connections start appearing. The cardboard is able to keep
      interconnected due to work and labor. That is the infrastructure of that network, made
      invisible and forgotten in ways similar to how the complex networks of forest and biomes are
      displaced and erased.
    </p>
    <p>Part of the idea here is to make a <a href="~laborgenic.md">laborgenic</a> game.</p>
  </div>
  <div class="card-footer flex-grow-0" id="">Footer</div>
</div>
