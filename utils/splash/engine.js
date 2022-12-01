function build(template) {
  const { html, head, css, body, header, main, form, footer } = template;
  return html(head.call(this, { style: css() }), body(header.call(this), main(form.call(this)), footer()));
}

function render(props, template) {
  return build.call(props, template);
}

module.exports = {
  build: build,
  render: render,
};
