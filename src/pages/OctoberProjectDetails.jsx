import { Link, useParams } from 'react-router-dom';
import octoberData from '../data/octoberProjects.json';

const egpFormatter = new Intl.NumberFormat('ar-EG');
const areaFormatter = new Intl.NumberFormat('ar-EG');

const bedroomLabels = {
	'1br': 'غرفة واحدة',
	'2br': 'غرفتين',
	'3br': '3 غرف',
	'4br': '4 غرف',
};

function formatEgp(value) {
	if (value === null || value === undefined || value === '') return '—';
	return `${egpFormatter.format(value)} جنيه`;
}

function formatAreaRange(minValue, maxValue, notes) {
	if (!minValue && !maxValue) return notes || '—';
	if (minValue && maxValue) return `${areaFormatter.format(minValue)} - ${areaFormatter.format(maxValue)} م²`;
	const value = minValue || maxValue;
	return `${areaFormatter.format(value)} م²`;
}

function formatPercent(value) {
	if (value === null || value === undefined || value === '') return '—';
	return `${value}%`;
}

function statusBadge(status) {
	const normalized = (status || '').toLowerCase();
	const map = {
		'off plan': { label: 'Off Plan', color: 'bg-amber-300/20 text-amber-100 border-amber-300/40' },
		'under construction': { label: 'تحت الإنشاء', color: 'bg-sky-300/20 text-sky-100 border-sky-300/40' },
		'ready': { label: 'جاهز للاستلام', color: 'bg-emerald-300/20 text-emerald-100 border-emerald-300/40' },
	};
	const entry = map[normalized] || { label: status || 'غير محدد', color: 'bg-white/10 text-white border-white/20' };
	return (
		<span className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-inner shadow-black/30 ${entry.color}`}>
			{entry.label}
		</span>
	);
}

function slugify(value) {
	return (value || '')
		.toLowerCase()
		.replace(/[^\w\u0600-\u06FF]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function getBedroomKey(value) {
	const key = (value || '').toLowerCase().replace(/\s+/g, '');
	if (key.includes('1br') || key.includes('1bed')) return '1br';
	if (key.includes('2br') || key.includes('2bed')) return '2br';
	if (key.includes('3br') || key.includes('3bed')) return '3br';
	if (key.includes('4br') || key.includes('4bed')) return '4br';
	return 'other';
}

export default function OctoberProjectDetails() {
	const { slug } = useParams();
	const projects = Array.isArray(octoberData?.projects) ? octoberData.projects : [];
	const project =
		projects.find((item) => item.slug === slug) ||
		projects.find((item) => slugify(item.name) === slug) ||
		projects[Number(slug)] ||
		projects[0];

	if (!project) {
		return (
			<div className="min-h-screen bg-slate-950 text-white">
				<div className="mx-auto max-w-4xl px-4 py-10">
					<p>المشروع غير موجود.</p>
					<Link className="text-amber-200 underline" to="/october">
						العودة لمشاريع أكتوبر
					</Link>
				</div>
			</div>
		);
	}

	const landmarks = project.location?.nearby_landmarks || [];
	const distances = project.location?.distance_to_landmarks_minutes || {};
	const unitPriceBreakdown = Array.isArray(project.unit_price_breakdown) ? project.unit_price_breakdown : [];
	const formatUnitType = (value) => {
		const key = (value || '').toLowerCase();
		return bedroomLabels[key] || value || '';
	};
	const groupedUnits = unitPriceBreakdown.reduce((acc, item) => {
		const key = getBedroomKey(item.unit_type);
		acc[key] = acc[key] || [];
		acc[key].push(item);
		return acc;
	}, {});

	return (
		<div className="min-h-screen bg-slate-950 text-white">
			<div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(248,180,0,0.16),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.14),transparent_25%)]" />
			<main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
				<Link
					to="/october"
					className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 shadow-inner shadow-black/30 hover:bg-white/20"
				>
					<span className="text-lg">←</span>
					<span>رجوع لقائمة المشاريع</span>
				</Link>

				<article className="overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 shadow-2xl shadow-black/40 backdrop-blur">
					<div className="relative h-72 w-full bg-black/40">
						{project.image_url ? (
							<img
								src={project.image_url}
								alt={project.name}
								className="h-full w-full object-cover"
								loading="lazy"
								decoding="async"
							/>
						) : null}
						<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
						<div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-sm text-white/70">{project.project_type || 'مشروع سكني'}</p>
								<h1 className="text-2xl font-bold text-white">{project.name}</h1>
								<p className="text-sm text-white/70">المطور: {project.developer || 'غير محدد'}</p>
							</div>
							{statusBadge(project.status)}
						</div>
					</div>

					<div className="grid gap-6 p-6 md:grid-cols-3">
						<div className="md:col-span-2 space-y-4">
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">الموقع</p>
									<p className="text-base font-semibold text-white">
										{project.location?.district || 'غير محدد'}
									</p>
									{project.location?.description ? (
										<p className="mt-1 text-xs text-white/60">{project.location.description}</p>
									) : null}
									{project.location?.map_url ? (
										<a
											href={project.location.map_url}
											target="_blank"
											rel="noreferrer"
											className="mt-2 inline-flex items-center gap-2 text-xs text-amber-200 hover:text-amber-100"
										>
											افتح الخريطة ↗
										</a>
									) : null}
								</div>
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">نوع الوحدات</p>
									<p className="text-base font-semibold text-white">
										{project.unit_types?.length ? project.unit_types.join(' • ') : 'غير محدد'}
									</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">المساحات المتاحة</p>
									<p className="text-base font-semibold">
										{formatAreaRange(project.areas_sqm?.min, project.areas_sqm?.max, project.areas_sqm?.notes)}
									</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">السعر الإجمالي</p>
									<p className="text-base font-semibold text-amber-200">
										{formatEgp(project.prices_egp?.unit_total_from)}
									</p>
									{project.prices_egp?.notes ? (
										<p className="mt-1 text-xs text-white/60">{project.prices_egp.notes}</p>
									) : null}
								</div>
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">سعر المتر</p>
									<p className="text-base font-semibold">{formatEgp(project.prices_egp?.price_per_sqm_from)}</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">مقدم الحجز</p>
									<p className="text-base font-semibold">{formatPercent(project.payment_plan?.down_payment_pct)}</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">مدة التقسيط</p>
									<p className="text-base font-semibold">
										{project.payment_plan?.installment_years ? `${project.payment_plan.installment_years} سنوات` : '—'}
									</p>
									{project.payment_plan?.notes ? (
										<p className="mt-1 text-xs text-white/60">{project.payment_plan.notes}</p>
									) : null}
								</div>
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">موعد الاستلام</p>
									<p className="text-base font-semibold">
										{project.handover?.date || project.handover?.status || '—'}
									</p>
								</div>
							</div>

							{landmarks.length ? (
								<div className="space-y-2">
									<p className="text-sm font-semibold text-white">المعالم القريبة</p>
									<div className="flex flex-wrap gap-2">
										{landmarks.map((landmark) => (
											<span
												key={landmark}
												className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white shadow-inner shadow-black/20"
											>
												{landmark}
											</span>
										))}
									</div>
								</div>
							) : null}

							{Object.keys(distances).length ? (
								<div className="space-y-2">
									<p className="text-sm font-semibold text-white">مدة الوصول التقريبية</p>
									<div className="grid gap-2 sm:grid-cols-2">
										{Object.entries(distances).map(([key, value]) => (
											<div
												key={key}
												className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 shadow-inner shadow-black/20"
											>
												{key}: {value ? `${value} دقيقة` : '—'}
											</div>
										))}
									</div>
								</div>
							) : null}

							{project.features?.length ? (
								<div className="space-y-2">
									<p className="text-sm font-semibold text-white">مميزات المشروع</p>
									<div className="flex flex-wrap gap-2">
										{project.features.map((feature) => (
											<span
												key={feature}
												className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white shadow-inner shadow-black/20"
											>
												{feature}
											</span>
										))}
									</div>
								</div>
							) : null}

							{unitPriceBreakdown.length ? (
								<div className="space-y-3">
									<p className="text-sm font-semibold text-white">تفاصيل أسعار الوحدات</p>
									{['1br', '2br', '3br', '4br', 'other'].map((groupKey) => {
										const items = groupedUnits[groupKey] || [];
										if (!items.length) return null;
										const groupLabel = bedroomLabels[groupKey] || 'وحدات أخرى';
										return (
											<div key={groupKey} className="space-y-2">
												<p className="text-xs font-semibold text-white/80">{groupLabel}</p>
												<div className="grid gap-2 sm:grid-cols-2">
													{items.map((item, idx) => {
														const labelParts = [
															item.variant,
															item.area_sqm ? `${areaFormatter.format(item.area_sqm)} م²` : '',
														]
															.filter(Boolean)
															.join(' • ');
														return (
															<div
																key={`${project.name}-${groupKey}-unit-${idx}`}
																className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 shadow-inner shadow-black/20"
															>
																<p className="font-semibold text-white">{labelParts || formatUnitType(item.unit_type) || 'وحدة'}</p>
																<p className="text-amber-200">{formatEgp(item.price_egp)}</p>
																{item.notes ? <p className="mt-1 text-[11px] text-white/60">{item.notes}</p> : null}
															</div>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>
							) : null}
						</div>

						<div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30">
							<p className="text-sm font-semibold text-white">ملخص سريع</p>
							<ul className="space-y-2 text-xs text-white/70">
								<li>المطور: {project.developer || 'غير محدد'}</li>
								<li>النوع: {project.project_type || 'مشروع سكني'}</li>
								<li>الحالة: {project.status || 'غير محدد'}</li>
								<li>الموقع: {project.location?.district || 'غير محدد'}</li>
							</ul>
						</div>
					</div>
				</article>
			</main>
		</div>
	);
}
